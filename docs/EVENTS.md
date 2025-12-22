# Events

`workflow` emits strongly-typed events throughout the execution lifecycle. Events provide monitoring, debugging, and integration capabilities.

## Event Types

### Workflow Events

#### `workflow:start`
Emitted when workflow execution begins.

```typescript
interface WorkflowStartEvent {
  type: 'workflow:start';
  workflowName: string;
  timestamp: Date;
}
```

#### `workflow:success`
Emitted when workflow completes successfully.

```typescript
interface WorkflowSuccessEvent {
  type: 'workflow:success';
  workflowName: string;
  timestamp: Date;
}
```

#### `workflow:fail`
Emitted when workflow fails with an error.

```typescript
interface WorkflowFailEvent {
  type: 'workflow:fail';
  workflowName: string;
  timestamp: Date;
  error: Error;
}
```

### Step Events

#### `step:start`
Emitted before step execution begins.

```typescript
interface StepStartEvent {
  type: 'step:start';
  workflowName: string;
  stepId: string;
  timestamp: Date;
}
```

#### `step:success`
Emitted when step completes successfully.

```typescript
interface StepSuccessEvent {
  type: 'step:success';
  workflowName: string;
  stepId: string;
  timestamp: Date;
  duration: number;  // Execution time in milliseconds
}
```

#### `step:fail`
Emitted when step fails with an error.

```typescript
interface StepFailEvent {
  type: 'step:fail';
  workflowName: string;
  stepId: string;
  timestamp: Date;
  error: Error;
  duration?: number;  // May be present if step started
}
```

#### `step:skip`
Emitted when step is skipped due to condition.

```typescript
interface StepSkipEvent {
  type: 'step:skip';
  workflowName: string;
  stepId: string;
  timestamp: Date;
}
```

## Event Timing

Events are emitted synchronously during execution:

1. `workflow:start` immediately when `engine.run()` is called
2. `step:start` before each step's execution
3. `step:success`/`step:fail`/`step:skip` after each step completes
4. `workflow:success`/`workflow:fail` when workflow finishes

## Event Listeners

Register listeners using the engine:

```typescript
const engine = new WorkflowEngine();

// Listen to specific events
engine.on('workflow:start', (event) => {
  console.log(`Workflow ${event.workflowName} started at ${event.timestamp}`);
});

engine.on('step:success', (event) => {
  console.log(`Step ${event.stepId} completed in ${event.duration}ms`);
});

// Remove listeners
engine.off('workflow:start', listener);
```

## Event Guarantees

- Events are emitted in deterministic order
- Listeners don't block execution
- Errors in listeners are caught and logged, not thrown
- All events include `workflowName` and `timestamp`
- Step events include `stepId`
- Success events include execution `duration`

## Example: Monitoring Execution

```typescript
const engine = new WorkflowEngine();

engine.on('workflow:start', () => console.log('Workflow started'));
engine.on('step:start', (event) => console.log(`Starting ${event.stepId}`));
engine.on('step:success', (event) => console.log(`${event.stepId} done (${event.duration}ms)`));
engine.on('step:fail', (event) => console.log(`${event.stepId} failed: ${event.error.message}`));
engine.on('workflow:success', () => console.log('Workflow completed'));
engine.on('workflow:fail', (event) => console.log(`Workflow failed: ${event.error.message}`));

await engine.run(workflow);
```