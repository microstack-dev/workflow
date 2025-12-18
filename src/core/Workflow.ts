import { Step } from './types';

export class Workflow {
  public readonly name: string;
  public readonly steps: Step[];

  constructor(name: string, steps: Step[]) {
    if (!name || typeof name !== 'string') {
      throw new Error('Workflow name must be a non-empty string');
    }

    if (!Array.isArray(steps) || steps.length === 0) {
      throw new Error('Workflow must have at least one step');
    }

    const stepIds = new Set<string>();
    for (const step of steps) {
      if (!step.id || typeof step.id !== 'string') {
        throw new Error('Each step must have a non-empty string id');
      }

      if (stepIds.has(step.id)) {
        throw new Error(`Duplicate step id: ${step.id}`);
      }

      stepIds.add(step.id);

      if (typeof step.run !== 'function') {
        throw new Error(`Step ${step.id} must have a run function`);
      }
    }

    this.name = name;
    this.steps = steps;
  }
}