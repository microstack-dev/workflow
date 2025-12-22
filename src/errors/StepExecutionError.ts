import { WorkflowError } from './WorkflowError';

export class StepExecutionError extends WorkflowError {
  public readonly stepId: string;

  constructor(stepId: string, workflowName: string, message: string, cause?: Error) {
    super(workflowName, message, cause);
    this.name = 'StepExecutionError';
    this.stepId = stepId;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, StepExecutionError);
    }
  }
}