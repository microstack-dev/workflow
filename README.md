# @microstack-dev/workflow

![npm version](https://img.shields.io/npm/v/@microstack-dev/workflow)
![license](https://img.shields.io/npm/l/@microstack-dev/workflow)
![downloads](https://img.shields.io/npm/dm/@microstack-dev/workflow)

A **minimal, strongly-typed, event-driven workflow engine** for TypeScript.

> **v0.1.0 Scope Notice**: This version intentionally focuses on core workflow execution only. No CLI, config loaders, persistence, or plugins.

## What `workflow` Is

* **Core workflow execution engine** - Run sequential steps with shared context
* **Event-driven lifecycle** - First-class events for monitoring and debugging
* **Strong TypeScript support** - Fully typed with no `any` types
* **Explicit over implicit** - Clear, predictable behavior with no magic
* **Extensible by design** - Clean architecture for future enhancements

## What `workflow` Is **Not**

* ❌ A CLI tool
* ❌ A YAML/JSON configuration system
* ❌ A persistence layer
* ❌ A cloud service or CI runner
* ❌ A plugin marketplace
* ❌ A visual workflow designer

## Quick Start

```typescript
import { defineWorkflow, createStep, WorkflowEngine } from 'workflow';

// Define a workflow
const workflow = defineWorkflow({
  name: 'data-pipeline',
  steps: [
    createStep('fetch-data')
      .run(async (ctx) => {
        const data = await fetchData();
        ctx.set('rawData', data);
      })
      .timeout(5000)
      .build(),
      
    createStep('process-data')
      .run(async (ctx) => {
        const rawData = ctx.get('rawData');
        const processed = processData(rawData);
        ctx.set('processedData', processed);
      })
      .condition(async (ctx) => ctx.has('rawData'))
      .build(),
      
    createStep('save-results')
      .run(async (ctx) => {
        const results = ctx.get('processedData');
        await saveToDatabase(results);
      })
      .retry(3)
      .build()
  ]
});

// Execute the workflow
const engine = new WorkflowEngine();

// Listen to events
engine.on('workflow:start', (event) => {
  console.log(`Starting workflow: ${event.workflowName}`);
});

engine.on('step:success', (event) => {
  console.log(`Step completed: ${event.stepId}`);
});

engine.on('workflow:success', (event) => {
  console.log(`Workflow completed successfully`);
});

// Run the workflow
await engine.run(workflow);
```

## Core Concepts

### Workflow Definition

Use `defineWorkflow` to create workflows with sequential steps:

```typescript
const workflow = defineWorkflow({
  name: string,
  steps: Step[]
});
```

### Steps

Steps are units of execution with optional conditions, retries, and timeouts:

```typescript
interface Step {
  id: string;
  run(ctx: WorkflowContext): Promise<void>;
  condition?: (ctx: WorkflowContext) => boolean | Promise<boolean>;
  retry?: number;
  timeout?: number;
}
```

### Step Builder

Use the fluent builder API for cleaner step creation:

```typescript
createStep('my-step')
  .run(async (ctx) => { /* ... */ })
  .condition(async (ctx) => true)
  .retry(3)
  .timeout(5000)
  .build();
```

### Workflow Context

Shared execution context that persists across steps:

```typescript
class WorkflowContext {
  data: Record<string, unknown>;
  env: NodeJS.ProcessEnv;

  get<T>(key: string): T | undefined;
  set(key: string, value: unknown): void;
  has(key: string): boolean;
  delete(key: string): boolean;
  clear(): void;
  clone(): WorkflowContext;
}
```

## Event Lifecycle

`workflow` emits first-class events for monitoring and debugging:

### Workflow Events
* `workflow:start` - Workflow execution begins
* `workflow:success` - Workflow completed successfully  
* `workflow:fail` - Workflow failed with error

### Step Events
* `step:start` - Step execution begins
* `step:success` - Step completed successfully
* `step:fail` - Step failed with error
* `step:skip` - Step skipped due to condition

### Event Structure

```typescript
interface WorkflowEvent {
  workflowName: string;
  stepId?: string;
  timestamp: Date;
  error?: Error;
}
```

## Error Handling

Explicit error types for different failure scenarios:

```typescript
// Workflow-level errors
class WorkflowError extends Error {
  workflowName: string;
  timestamp: Date;
}

// Step execution errors  
class StepError extends Error {
  stepId: string;
  workflowName: string;
  timestamp: Date;
}

// Step timeout errors
class TimeoutError extends Error {
  stepId: string;
  workflowName: string;
  timeout: number;
  timestamp: Date;
}
```

## API Reference

### Classes

* `Workflow` - Workflow definition with validation
* `WorkflowEngine` - Core execution engine with event emission
* `WorkflowContext` - Shared execution context
* `EventEmitter` - Event system for lifecycle events

### Functions

* `defineWorkflow(options)` - Create a workflow definition
* `createStep(id)` - Create a step with builder pattern

### Types

* `Step` - Step interface definition
* `WorkflowEvent` - Event structure
* `WorkflowEventType` - Union of all event types
* `WorkflowEventListener` - Event handler function type

## Installation

```bash
npm install workflow
```

**Requirements:**
* Node.js >= 18.0.0
* TypeScript >= 5.0

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Type checking
npm run typecheck

# Build
npm run build

# Development mode
npm run dev
```

## License

MIT © [microstack-dev](https://github.com/microstack-dev)

---

## v0.1.0 Release Notes

Initial release of `workflow`.

- Core workflow execution engine
- Step-based sequential execution  
- Shared execution context
- Retry & conditional logic
- Event-driven lifecycle

This version intentionally excludes CLI tooling, config loaders, and plugins.
