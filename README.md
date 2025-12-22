# @microstack-dev/workflow

![npm version](https://img.shields.io/npm/v/@microstack-dev/workflow)
![license](https://img.shields.io/npm/l/@microstack-dev/workflow)
![downloads](https://img.shields.io/npm/dm/@microstack-dev/workflow)

A **minimal, strongly-typed, event-driven workflow engine** for TypeScript.

> **v0.1.1 Scope Notice**: This version focuses on core workflow execution only. No CLI, config loaders, persistence, or plugins.

## Design Philosophy

`workflow` follows these core principles:

* **Simple > clever** - Straightforward APIs with predictable behavior
* **Explicit > implicit** - Clear error messages and no hidden side effects
* **Library > framework** - Focused on composition, not configuration
* **Core first, extensions later** - Essential features only, extensible architecture
* **Type safety is a feature** - Full TypeScript support prevents runtime errors

## What `workflow` Is

* **Core workflow execution engine** - Run sequential steps with shared context
* **Event-driven lifecycle** - First-class events for monitoring and debugging
* **Strong TypeScript support** - Fully typed with no `any` types
* **Explicit error handling** - Clear error types and propagation
* **Extensible by design** - Clean architecture for future enhancements

## What `workflow` Is **Not**

* ❌ A CLI tool
* ❌ A YAML/JSON configuration system
* ❌ A persistence layer
* ❌ A cloud service or CI runner
* ❌ A plugin marketplace
* ❌ A visual workflow designer

## Installation

```bash
npm install @microstack-dev/workflow
```

**Requirements:**
* Node.js >= 18.0.0
* TypeScript >= 5.0

## Quick Start

```typescript
import { defineWorkflow, createStep, WorkflowEngine } from '@microstack-dev/workflow';

const workflow = defineWorkflow({
  name: 'example',
  steps: [
    createStep('greet')
      .run(async (ctx) => {
        ctx.set('message', 'Hello, world!');
      })
      .build()
  ]
});

const engine = new WorkflowEngine();
await engine.run(workflow);
```

## Error Handling

```typescript
import { WorkflowEngine, StepExecutionError, TimeoutError } from '@microstack-dev/workflow';

const engine = new WorkflowEngine();

try {
  await engine.run(workflow);
} catch (error) {
  if (error instanceof StepExecutionError) {
    console.error(`Step failed: ${error.stepId}`);
  } else if (error instanceof TimeoutError) {
    console.error(`Step timed out: ${error.stepId} (${error.timeout}ms)`);
  }
}
```

## Event Lifecycle

`workflow` emits events for monitoring:

```typescript
const engine = new WorkflowEngine();

engine.on('workflow:start', (event) => {
  console.log(`Started: ${event.workflowName}`);
});

engine.on('step:success', (event) => {
  console.log(`Step completed: ${event.stepId} (${event.duration}ms)`);
});
```

See [Events Documentation](docs/EVENTS.md) for complete details.

## Versioning & Stability

`workflow` v0.1.1 is stable for core workflow execution. The API is backward compatible. Future versions may add extensions without breaking changes.

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - Core execution model
- [Events](docs/EVENTS.md) - Event system reference
- [Errors](docs/ERRORS.md) - Error handling guide
- [FAQ](docs/FAQ.md) - Common questions

## Changelog

### v0.1.1

#### Improvements
- Improved TypeScript typings and API ergonomics
- Enhanced workflow and step lifecycle events
- More predictable error handling and diagnostics

#### Fixes
- Resolved edge cases with step timeouts and retries
- Improved execution stability for async workflows

#### Documentation
- Expanded README with clearer usage and design notes
- Added dedicated documentation files for architecture, events, and errors

### v0.1.0

Initial release of `workflow`.

- Core workflow execution engine
- Step-based sequential execution
- Shared execution context
- Retry & conditional logic
- Event-driven lifecycle

This version intentionally excludes CLI tooling, config loaders, and plugins.

## License

MIT © [microstack-dev](https://github.com/microstack-dev)

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



---

## v0.1.1

### Improvements
- Improved TypeScript typings and API ergonomics
- Enhanced workflow and step event payloads
- More robust error handling and diagnostics

### Fixes
- Fixed edge cases around step timeouts and retries
- Improved execution stability for async workflows

### Documentation
- Clarified usage examples and design goals

## v0.1.0 Release Notes

Initial release of `workflow`.

- Core workflow execution engine
- Step-based sequential execution
- Shared execution context
- Retry & conditional logic
- Event-driven lifecycle

This version intentionally excludes CLI tooling, config loaders, and plugins.
