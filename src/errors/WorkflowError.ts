export class WorkflowError extends Error {
  public readonly workflowName: string;
  public readonly timestamp: Date;

  constructor(workflowName: string, message: string, cause?: Error) {
    super(message);
    this.name = 'WorkflowError';
    this.workflowName = workflowName;
    this.timestamp = new Date();
    
    if (cause) {
      this.cause = cause;
    }

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WorkflowError);
    }
  }
}