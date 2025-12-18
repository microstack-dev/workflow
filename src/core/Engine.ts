import { Workflow } from './Workflow';
import { WorkflowContext } from './Context';
import { Step } from './types';
import { EventEmitter } from '../events/EventEmitter';

import { StepError } from '../errors/StepError';
import { TimeoutError } from '../errors/TimeoutError';

export class WorkflowEngine {
  private eventEmitter: EventEmitter;

  constructor() {
    this.eventEmitter = new EventEmitter();
  }

  async run(workflow: Workflow, initialData?: Record<string, unknown>): Promise<void> {
    const context = new WorkflowContext(initialData);
    
    try {
      await this.eventEmitter.emit({
        type: 'workflow:start',
        workflowName: workflow.name,
        timestamp: new Date()
      });

      for (const step of workflow.steps) {
        await this.executeStep(step, workflow.name, context);
      }

      await this.eventEmitter.emit({
        type: 'workflow:success',
        workflowName: workflow.name,
        timestamp: new Date()
      });
    } catch (error) {
      await this.eventEmitter.emit({
        type: 'workflow:fail',
        workflowName: workflow.name,
        timestamp: new Date(),
        error: error instanceof Error ? error : new Error(String(error))
      });
      throw error;
    }
  }

  private async executeStep(step: Step, workflowName: string, context: WorkflowContext): Promise<void> {
    try {
      const shouldRun = step.condition ? await step.condition(context) : true;
      
      if (!shouldRun) {
        await this.eventEmitter.emit({
          type: 'step:skip',
          workflowName,
          stepId: step.id,
          timestamp: new Date()
        });
        return;
      }

      await this.eventEmitter.emit({
        type: 'step:start',
        workflowName,
        stepId: step.id,
        timestamp: new Date()
      });

      await this.executeStepWithRetry(step, workflowName, context);

      await this.eventEmitter.emit({
        type: 'step:success',
        workflowName,
        stepId: step.id,
        timestamp: new Date()
      });
    } catch (error) {
      await this.eventEmitter.emit({
        type: 'step:fail',
        workflowName,
        stepId: step.id,
        timestamp: new Date(),
        error: error instanceof Error ? error : new Error(String(error))
      });
      
      if (error instanceof StepError || error instanceof TimeoutError) {
        throw error;
      }
      
      throw new StepError(step.id, workflowName, error instanceof Error ? error.message : String(error), error instanceof Error ? error : undefined);
    }
  }

  private async executeStepWithRetry(step: Step, workflowName: string, context: WorkflowContext): Promise<void> {
    const maxRetries = step.retry ?? 0;
    let lastError: Error | unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (step.timeout) {
          await this.executeWithTimeout(step, context, step.timeout, workflowName);
        } else {
          await step.run(context);
        }
        return;
      } catch (error) {
        lastError = error;
        
        if (error instanceof TimeoutError) {
          throw error;
        }
        
        if (attempt === maxRetries) {
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }

    throw lastError;
  }

  private async executeWithTimeout(step: Step, context: WorkflowContext, timeoutMs: number, workflowName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new TimeoutError(step.id, workflowName, timeoutMs));
      }, timeoutMs);

      step.run(context)
        .then(() => {
          clearTimeout(timeoutId);
          resolve();
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  on(event: import('./types').WorkflowEventType, handler: import('./types').WorkflowEventListener): void {
    this.eventEmitter.on(event, handler);
  }

  off(event: import('./types').WorkflowEventType, handler: import('./types').WorkflowEventListener): void {
    this.eventEmitter.off(event, handler);
  }
}