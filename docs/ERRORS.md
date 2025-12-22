# Errors

`workflow` provides explicit error classes for different failure scenarios. All errors include context about what failed and when.

## Error Classes

### `WorkflowError`
Base class for all workflow-related errors.

```typescript
class WorkflowError extends Error {
  workflowName: string;
  timestamp: Date;
}
```

Thrown when: Workflow-level failures occur.

### `StepExecutionError`
Thrown when a step fails during execution.

```typescript
class StepExecutionError extends WorkflowError {
  stepId: string;
}
```

Thrown when: A step's `run` function throws an error or returns a rejected promise.

### `TimeoutError`
Thrown when a step exceeds its timeout limit.

```typescript
class TimeoutError extends WorkflowError {
  stepId: string;
  timeout: number;  // Timeout value in milliseconds
}
```

Thrown when: A step's execution time exceeds the configured `timeout`.

### `StepError` (Legacy)
Deprecated. Use `StepExecutionError` instead.

## Error Handling

### Synchronous Error Handling

```typescript
const engine = new WorkflowEngine();

try {
  await engine.run(workflow);
} catch (error) {
  if (error instanceof StepExecutionError) {
    console.error(`Step ${error.stepId} in ${error.workflowName} failed: ${error.message}`);
  } else if (error instanceof TimeoutError) {
    console.error(`Step ${error.stepId} timed out after ${error.timeout}ms`);
  } else if (error instanceof WorkflowError) {
    console.error(`Workflow ${error.workflowName} failed: ${error.message}`);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Event-Based Error Monitoring

```typescript
engine.on('step:fail', (event) => {
  console.error(`Step failed: ${event.error.message}`, {
    stepId: event.stepId,
    workflowName: event.workflowName,
    timestamp: event.timestamp,
    duration: event.duration
  });
});

engine.on('workflow:fail', (event) => {
  console.error(`Workflow failed: ${event.error.message}`, {
    workflowName: event.workflowName,
    timestamp: event.timestamp
  });
});
```

## Error Propagation

- Step errors are wrapped in `StepExecutionError` with step and workflow context
- Timeout errors are thrown as `TimeoutError` with timeout details
- Workflow errors bubble up with full context
- Original error causes are preserved where possible

## Best Practices

1. **Always catch errors** from `engine.run()` - workflows can fail
2. **Use event listeners** for monitoring without affecting execution flow
3. **Check error types** to handle different failure modes appropriately
4. **Log errors** with full context for debugging
5. **Don't rely on error messages** for program logic - use error types instead

## Common Error Scenarios

### Step Execution Failure
```typescript
createStep('failing-step')
  .run(async (ctx) => {
    throw new Error('Something went wrong');
  })
  .build()
// Throws: StepExecutionError { stepId: 'failing-step', ... }
```

### Step Timeout
```typescript
createStep('slow-step')
  .run(async (ctx) => {
    await new Promise(resolve => setTimeout(resolve, 10000));
  })
  .timeout(100)
  .build()
// Throws: TimeoutError { stepId: 'slow-step', timeout: 100, ... }
```

### Conditional Skip
Steps with failing conditions don't throw errors - they emit `step:skip` events instead.