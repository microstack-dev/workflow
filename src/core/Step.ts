import { Step } from './types';

export class StepBuilder {
  private step: Partial<Step> = {};

  constructor(id: string) {
    if (!id || typeof id !== 'string') {
      throw new Error('Step id must be a non-empty string');
    }
    this.step.id = id;
  }

  run(fn: (_ctx: import('./Context').WorkflowContext) => Promise<void>): StepBuilder {
    this.step.run = fn;
    return this;
  }

  condition(fn: (_ctx: import('./Context').WorkflowContext) => boolean | Promise<boolean>): StepBuilder {
    this.step.condition = fn;
    return this;
  }

  retry(count: number): StepBuilder {
    if (count < 0 || !Number.isInteger(count)) {
      throw new Error('Retry count must be a non-negative integer');
    }
    this.step.retry = count;
    return this;
  }

  timeout(ms: number): StepBuilder {
    if (ms <= 0 || !Number.isInteger(ms)) {
      throw new Error('Timeout must be a positive integer');
    }
    this.step.timeout = ms;
    return this;
  }

  build(): Step {
    if (!this.step.run) {
      throw new Error(`Step ${this.step.id} must have a run function`);
    }

    return this.step as Step;
  }
}

export function createStep(id: string): StepBuilder {
  return new StepBuilder(id);
}