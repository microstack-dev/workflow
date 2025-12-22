import { Workflow } from './Workflow';
import { WorkflowContext } from './Context';
import { Step, TypedWorkflowEvent, WorkflowEventType } from './types';
import { EventEmitter } from '../events/EventEmitter';

import { StepExecutionError } from '../errors/StepExecutionError';
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
      } as TypedWorkflowEvent);

      for (const step of workflow.steps) {
        await this.executeStep(step, workflow.name, context);
      }

      await this.eventEmitter.emit({
        type: 'workflow:success',
        workflowName: workflow.name,
        timestamp: new Date()
      } as TypedWorkflowEvent);
    } catch (error) {
      await this.eventEmitter.emit({
        type: 'workflow:fail',
        workflowName: workflow.name,
        timestamp: new Date(),
        error: error instanceof Error ? error : new Error(String(error))
      } as TypedWorkflowEvent);
      throw error;
    }
  }

  /**
   * Executes a single step, handling conditions, retries, timeouts, and events.
   * Tracks execution duration and emits appropriate lifecycle events.
   */
  /**
   * Executes a single step, handling conditions, retries, timeouts, and events.
   * Tracks execution duration and emits appropriate lifecycle events.
   */
  private async executeStep(step: Step, workflowName: string, context: WorkflowContext): Promise<void> {
    const stepStartTime = Date.now();

    try {
      // Check condition - skip if false
      const shouldRun = step.condition ? await step.condition(context) : true;

      if (!shouldRun) {
        await this.eventEmitter.emit({
          type: 'step:skip',
          workflowName,
          stepId: step.id,
          timestamp: new Date()
        } as TypedWorkflowEvent);
        return;
      }

      // Emit start event
      await this.eventEmitter.emit({
        type: 'step:start',
        workflowName,
        stepId: step.id,
        timestamp: new Date()
      } as TypedWorkflowEvent);

      // Execute with retry logic
      await this.executeStepWithRetry(step, workflowName, context);

      // Calculate duration and emit success
      const duration = Date.now() - stepStartTime;
      await this.eventEmitter.emit({
        type: 'step:success',
        workflowName,
        stepId: step.id,
        timestamp: new Date(),
        duration
      } as TypedWorkflowEvent);
    } catch (error) {
      // Calculate duration and emit failure
      const duration = Date.now() - stepStartTime;
      await this.eventEmitter.emit({
        type: 'step:fail',
        workflowName,
        stepId: step.id,
        timestamp: new Date(),
        error: error instanceof Error ? error : new Error(String(error)),
        duration
      } as TypedWorkflowEvent);

      // Re-throw known errors as-is, wrap others in StepExecutionError
      if (error instanceof StepExecutionError || error instanceof TimeoutError) {
        throw error;
      }

      throw new StepExecutionError(step.id, workflowName, error instanceof Error ? error.message : String(error), error instanceof Error ? error : undefined);
    }
  }

  /**
   * Executes a step with retry logic. Attempts execution up to maxRetries + 1 times.
   * Uses exponential backoff for retry delays, with a maximum delay of 30 seconds.
   * Timeout errors are not retried as they indicate systemic issues.
   */
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
        return; // Success, exit retry loop
      } catch (error) {
        lastError = error;

        // Don't retry on timeout - timeouts indicate the step is stuck, not transiently failing
        if (error instanceof TimeoutError) {
          throw error;
        }

        if (attempt === maxRetries) {
          break; // No more retries, will throw lastError
        }

        // Exponential backoff with maximum delay of 30 seconds
        const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Executes a step with a timeout. If the step doesn't complete within timeoutMs,
   * rejects with a TimeoutError. Properly cleans up the timeout timer on completion.
   */
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

  on(event: WorkflowEventType, handler: import('./types').WorkflowEventListener): void {
    this.eventEmitter.on(event, handler);
  }

  off(event: WorkflowEventType, handler: import('./types').WorkflowEventListener): void {
    this.eventEmitter.off(event, handler);
  }
}