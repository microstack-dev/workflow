import { describe, it, expect, beforeEach } from '@jest/globals';
import { WorkflowEngine } from '../src/core/Engine';
import { createStep } from '../src/core/Step';
import { defineWorkflow } from '../src/defineWorkflow';
import { StepError, TimeoutError } from '../src/index';

describe('WorkflowEngine', () => {
  let engine: WorkflowEngine;

  beforeEach(() => {
    engine = new WorkflowEngine();
  });

  describe('basic execution', () => {
    it('should execute steps in order', async () => {
      const executionOrder: string[] = [];

      const workflow = defineWorkflow({
        name: 'test-workflow',
        steps: [
          createStep('step1').run(async () => {
            executionOrder.push('step1');
          }).build(),
          createStep('step2').run(async () => {
            executionOrder.push('step2');
          }).build(),
          createStep('step3').run(async () => {
            executionOrder.push('step3');
          }).build()
        ]
      });

      await engine.run(workflow);

      expect(executionOrder).toEqual(['step1', 'step2', 'step3']);
    });

    it('should pass context between steps', async () => {
      const workflow = defineWorkflow({
        name: 'context-test',
        steps: [
          createStep('set-value').run(async (ctx) => {
            ctx.set('testKey', 'testValue');
          }).build(),
          createStep('get-value').run(async (ctx) => {
            const value = ctx.get<string>('testKey');
            expect(value).toBe('testValue');
          }).build()
        ]
      });

      await engine.run(workflow);
    });
  });

  describe('conditional execution', () => {
    it('should skip steps when condition is false', async () => {
      const executedSteps: string[] = [];

      const workflow = defineWorkflow({
        name: 'conditional-test',
        steps: [
          createStep('always-run').run(async () => {
            executedSteps.push('always-run');
          }).build(),
          createStep('skip-me').run(async () => {
            executedSteps.push('skip-me');
          }).condition(async () => false).build(),
          createStep('run-after-skip').run(async () => {
            executedSteps.push('run-after-skip');
          }).build()
        ]
      });

      await engine.run(workflow);

      expect(executedSteps).toEqual(['always-run', 'run-after-skip']);
    });

    it('should execute steps when condition is true', async () => {
      const executedSteps: string[] = [];

      const workflow = defineWorkflow({
        name: 'conditional-test',
        steps: [
          createStep('always-run').run(async () => {
            executedSteps.push('always-run');
          }).build(),
          createStep('run-me').run(async () => {
            executedSteps.push('run-me');
          }).condition(async () => true).build()
        ]
      });

      await engine.run(workflow);

      expect(executedSteps).toEqual(['always-run', 'run-me']);
    });
  });

  describe('retry logic', () => {
    it('should retry failed steps', async () => {
      let attempts = 0;

      const workflow = defineWorkflow({
        name: 'retry-test',
        steps: [
          createStep('flaky-step').run(async () => {
            attempts++;
            if (attempts < 3) {
              throw new Error('Temporary failure');
            }
          }).retry(3).build()
        ]
      });

      await engine.run(workflow);

      expect(attempts).toBe(3);
    });

    it('should fail after max retries', async () => {
      let attempts = 0;

      const workflow = defineWorkflow({
        name: 'retry-fail-test',
        steps: [
          createStep('always-fail').run(async () => {
            attempts++;
            throw new Error('Permanent failure');
          }).retry(2).build()
        ]
      });

      await expect(engine.run(workflow)).rejects.toThrow(StepError);
      expect(attempts).toBe(3);
    });
  });

  describe('timeout handling', () => {
    it('should fail steps that exceed timeout', async () => {
      const workflow = defineWorkflow({
        name: 'timeout-test',
        steps: [
          createStep('slow-step').run(async () => {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }).timeout(100).build()
        ]
      });

      await expect(engine.run(workflow)).rejects.toThrow(TimeoutError);
    });

    it('should complete steps within timeout', async () => {
      const workflow = defineWorkflow({
        name: 'timeout-success-test',
        steps: [
          createStep('fast-step').run(async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
          }).timeout(200).build()
        ]
      });

      await expect(engine.run(workflow)).resolves.not.toThrow();
    });
  });

  describe('events', () => {
    it('should emit workflow lifecycle events', async () => {
      const events: string[] = [];

      engine.on('workflow:start', () => { events.push('workflow:start'); });
      engine.on('workflow:success', () => { events.push('workflow:success'); });

      const workflow = defineWorkflow({
        name: 'events-test',
        steps: [
          createStep('test-step').run(async () => {}).build()
        ]
      });

      await engine.run(workflow);

      expect(events).toEqual(['workflow:start', 'workflow:success']);
    });

    it('should emit step lifecycle events', async () => {
      const events: string[] = [];

      engine.on('step:start', () => { events.push('step:start'); });
      engine.on('step:success', () => { events.push('step:success'); });

      const workflow = defineWorkflow({
        name: 'step-events-test',
        steps: [
          createStep('test-step').run(async () => {}).build()
        ]
      });

      await engine.run(workflow);

      expect(events).toEqual(['step:start', 'step:success']);
    });

    it('should emit skip events', async () => {
      const events: string[] = [];

      engine.on('step:skip', () => { events.push('step:skip'); });

      const workflow = defineWorkflow({
        name: 'skip-events-test',
        steps: [
          createStep('skip-me').run(async () => {}).condition(async () => false).build()
        ]
      });

      await engine.run(workflow);

      expect(events).toEqual(['step:skip']);
    });

    it('should emit failure events', async () => {
      const events: string[] = [];

      engine.on('step:fail', () => { events.push('step:fail'); });
      engine.on('workflow:fail', () => { events.push('workflow:fail'); });

      const workflow = defineWorkflow({
        name: 'failure-events-test',
        steps: [
          createStep('fail-step').run(async () => {
            throw new Error('Test failure');
          }).build()
        ]
      });

      await expect(engine.run(workflow)).rejects.toThrow();

      expect(events).toEqual(['step:fail', 'workflow:fail']);
    });
  });

  describe('error handling', () => {
    it('should wrap step errors in StepError', async () => {
      const workflow = defineWorkflow({
        name: 'error-test',
        steps: [
          createStep('error-step').run(async () => {
            throw new Error('Step error');
          }).build()
        ]
      });

      await expect(engine.run(workflow)).rejects.toThrow(StepError);
    });

    it('should preserve error context', async () => {
      const workflow = defineWorkflow({
        name: 'error-context-test',
        steps: [
          createStep('error-step').run(async () => {
            throw new Error('Step error');
          }).build()
        ]
      });

      try {
        await engine.run(workflow);
      } catch (error) {
        expect(error).toBeInstanceOf(StepError);
        if (error instanceof StepError) {
          expect(error.stepId).toBe('error-step');
          expect(error.workflowName).toBe('error-context-test');
        }
      }
    });
  });
});