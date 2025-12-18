export class TimeoutError extends Error {
  public readonly stepId: string;
  public readonly workflowName: string;
  public readonly timeout: number;
  public readonly timestamp: Date;

  constructor(stepId: string, workflowName: string, timeout: number, cause?: Error) {
    super(`Step ${stepId} timed out after ${timeout}ms`);
    this.name = 'TimeoutError';
    this.stepId = stepId;
    this.workflowName = workflowName;
    this.timeout = timeout;
    this.timestamp = new Date();
    
    if (cause) {
      this.cause = cause;
    }

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TimeoutError);
    }
  }
}