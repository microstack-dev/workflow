export class WorkflowContext {
  public readonly data: Record<string, unknown>;
  public readonly env: NodeJS.ProcessEnv;

  constructor(initialData?: Record<string, unknown>, env?: NodeJS.ProcessEnv) {
    this.data = { ...initialData };
    this.env = { ...env, ...process.env };
  }

  get<T = unknown>(key: string): T | undefined {
    return this.data[key] as T | undefined;
  }

  set(key: string, value: unknown): void {
    if (!key || typeof key !== 'string') {
      throw new Error('Context key must be a non-empty string');
    }
    this.data[key] = value;
  }

  has(key: string): boolean {
    return key in this.data;
  }

  delete(key: string): boolean {
    if (key in this.data) {
      delete this.data[key];
      return true;
    }
    return false;
  }

  clear(): void {
    Object.keys(this.data).forEach(key => delete this.data[key]);
  }

  clone(): WorkflowContext {
    return new WorkflowContext({ ...this.data }, { ...this.env });
  }
}