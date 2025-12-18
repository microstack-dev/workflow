import { Workflow } from './core/Workflow';
import { Step } from './core/types';

export interface DefineWorkflowOptions {
  name: string;
  steps: Step[];
}

export function defineWorkflow(options: DefineWorkflowOptions): Workflow {
  return new Workflow(options.name, options.steps);
}