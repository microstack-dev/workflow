import { WorkflowContext } from './Context';

export interface Step {
  id: string;
  run(_ctx: WorkflowContext): Promise<void>;
  condition?: (_ctx: WorkflowContext) => boolean | Promise<boolean>;
  retry?: number;
  timeout?: number;
}

export interface WorkflowEvent {
  workflowName: string;
  stepId?: string;
  timestamp: Date;
  error?: Error;
}

export type WorkflowEventType = 
  | 'workflow:start'
  | 'workflow:success'
  | 'workflow:fail'
  | 'step:start'
  | 'step:success'
  | 'step:fail'
  | 'step:skip';

export interface WorkflowEventListener<T extends WorkflowEvent = WorkflowEvent> {
  (_event: T): void | Promise<void>;
}