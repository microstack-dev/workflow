import { TypedWorkflowEvent, WorkflowEventListener, WorkflowEventType } from '../core/types';

export class EventEmitter {
  private listeners: Map<WorkflowEventType, Set<WorkflowEventListener>> = new Map();

  on(event: WorkflowEventType, listener: WorkflowEventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: WorkflowEventType, listener: WorkflowEventListener): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  async emit(event: TypedWorkflowEvent): Promise<void> {
    const eventListeners = this.listeners.get(event.type);
    if (eventListeners) {
      const promises = Array.from(eventListeners).map(async (listener) => {
        try {
          await listener(event);
        } catch (error) {
          console.error(`Error in event listener for ${event.type}:`, error);
        }
      });
      await Promise.all(promises);
    }
  }

  removeAllListeners(event?: WorkflowEventType): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  listenerCount(event: WorkflowEventType): number {
    return this.listeners.get(event)?.size || 0;
  }
}