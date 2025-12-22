import { WorkflowContext } from './Context';

export interface Step {
  id: string;
  run(_ctx: WorkflowContext): Promise<void>;
  condition?: (_ctx: WorkflowContext) => boolean | Promise<boolean>;
  retry?: number;
  timeout?: number;
}

// Base workflow event interface
export interface WorkflowEvent {
  workflowName: string;
  stepId?: string;
  timestamp: Date;
  duration?: number; // Duration in milliseconds for step execution
  error?: Error;
}

// Specific event interfaces for better type safety
export interface WorkflowStartEvent extends Omit<WorkflowEvent, 'stepId' | 'duration' | 'error'> {
  type: 'workflow:start';
}

export interface WorkflowSuccessEvent extends Omit<WorkflowEvent, 'stepId' | 'duration' | 'error'> {
  type: 'workflow:success';
}

export interface WorkflowFailEvent extends Omit<WorkflowEvent, 'error'> {
  type: 'workflow:fail';
  error: Error;
}

export interface StepStartEvent extends Omit<WorkflowEvent, 'duration' | 'error'> {
  type: 'step:start';
  stepId: string;
}

export interface StepSuccessEvent extends Omit<WorkflowEvent, 'error'> {
  type: 'step:success';
  stepId: string;
  duration: number; // Required for step success
}

export interface StepFailEvent extends WorkflowEvent {
  type: 'step:fail';
  stepId: string;
  error: Error;
  duration?: number; // May be present if step started but failed
}

export interface StepSkipEvent extends Omit<WorkflowEvent, 'duration' | 'error'> {
  type: 'step:skip';
  stepId: string;
}

export type WorkflowEventType =
  | 'workflow:start'
  | 'workflow:success'
  | 'workflow:fail'
  | 'step:start'
  | 'step:success'
  | 'step:fail'
  | 'step:skip';

export type TypedWorkflowEvent =
  | WorkflowStartEvent
  | WorkflowSuccessEvent
  | WorkflowFailEvent
  | StepStartEvent
  | StepSuccessEvent
  | StepFailEvent
  | StepSkipEvent;

export interface WorkflowEventListener<T extends TypedWorkflowEvent = TypedWorkflowEvent> {
  (_event: T): void | Promise<void>;
}