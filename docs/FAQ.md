# FAQ

Frequently asked questions about `workflow`.

## Why no CLI?

`workflow` is a library for embedding workflow execution in applications, not a standalone tool. CLI functionality would be added as a separate package if needed.

## Why no persistence?

v0.1.x focuses on in-memory execution. Persistence layers can be built on top using events or by extending the context system.

## Why no configuration files?

`workflow` uses code as configuration for full TypeScript support and IDE assistance. No YAML/JSON needed.

## Is this a framework?

No, `workflow` is a library. It provides composable APIs without imposing structure on your application.

## Is this production-ready?

Yes, v0.1.1 is stable for core workflow execution. The API is backward compatible.

## How does this compare to [other tool]?

`workflow` focuses on minimal, typed, event-driven execution. It doesn't include scheduling, UI, or persistence features found in other tools.

## Can I run workflows concurrently?

Each `WorkflowEngine` instance runs one workflow at a time. Create multiple engine instances for concurrent execution.

## How do I handle large workflows?

Keep workflows focused on a single business process. Break complex workflows into smaller, composable ones.

## Can I cancel running workflows?

Not in v0.1.x. Use timeouts on individual steps to prevent hanging.

## How do I test workflows?

Use the standard testing approach for your steps. The engine is deterministic and can be tested like any async function.

## What's the performance overhead?

Minimal. Events are synchronous, context is in-memory, and execution is straightforward JavaScript.

## Can I use this with [framework X]?

Yes, `workflow` is framework-agnostic and works with any JavaScript/TypeScript environment.

## How do I migrate from v0.1.0?

No changes needed - v0.1.1 is backward compatible. Update for better error handling and events.