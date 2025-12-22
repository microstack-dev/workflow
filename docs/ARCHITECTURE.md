# Architecture

`workflow` is a minimal, strongly-typed workflow execution engine built for TypeScript. This document explains the core execution model, step lifecycle, context flow, event emission, and error propagation.

## Core Execution Model

The workflow engine executes steps sequentially in the order they are defined. Each step has access to a shared context that persists across the entire workflow execution.

```typescript
const workflow = defineWorkflow({
  name: 'example',
  steps: [step1, step2, step3]  // Executed in order
});

await engine.run(workflow);  // step1 → step2 → step3
```

## Step Lifecycle

Each step goes through the following phases:

1. **Condition Check**: If a condition is defined, it's evaluated. If false, the step is skipped.
2. **Execution**: The step's `run` function is called with the shared context.
3. **Retry Logic**: If execution fails and retries are configured, the step is retried with exponential backoff.
4. **Timeout Handling**: If a timeout is configured, execution is aborted if it exceeds the limit.

Steps are atomic - they either succeed completely or fail, with the context reflecting the final state.

## Context Flow

The `WorkflowContext` provides shared state across all steps:

- **Data**: A key-value store for workflow data (`Record<string, unknown>`)
- **Environment**: Access to process environment variables
- **Immutability**: Context is passed by reference but should be treated as immutable except through `set()` operations

```typescript
// In step 1
ctx.set('userId', 123);

// In step 2
const userId = ctx.get<number>('userId');  // Available
```

## Event Emission Flow

Events are emitted synchronously during execution:

1. `workflow:start` - When workflow begins
2. `step:start` - Before each step execution
3. `step:success` or `step:fail` or `step:skip` - After each step
4. `workflow:success` or `workflow:fail` - When workflow completes

Event listeners are called asynchronously but do not block execution. Errors in listeners are logged but don't affect workflow execution.

## Error Propagation

Errors bubble up predictably:

- Step errors are wrapped in `StepExecutionError` or `TimeoutError`
- Workflow errors are wrapped in `WorkflowError`
- The engine throws the first error encountered, stopping execution
- Event listeners receive error details for monitoring

```typescript
try {
  await engine.run(workflow);
} catch (error) {
  if (error instanceof StepExecutionError) {
    // Handle step failure
  }
}
```

## Execution Guarantees

- Steps execute in definition order
- Context changes are preserved across steps
- Events are emitted deterministically
- Timeouts prevent hanging executions
- Retries respect configured limits and delays