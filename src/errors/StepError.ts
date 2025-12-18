export class StepError extends Error {
  public readonly stepId: string;
  public readonly workflowName: string;
  public readonly timestamp: Date;

  constructor(stepId: string, workflowName: string, message: string, cause?: Error) {
    super(message);
    this.name = 'StepError';
    this.stepId = stepId;
    this.workflowName = workflowName;
    this.timestamp = new Date();
    
    if (cause) {
      this.cause = cause;
    }

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, StepError);
    }
  }
}