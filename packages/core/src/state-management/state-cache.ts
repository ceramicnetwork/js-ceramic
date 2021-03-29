import { LRUMap } from 'lru_map';

export class StateCache<T> implements Iterable<[string, T]> {
  readonly volatile: LRUMap<string, T>;
  readonly durable: Map<string, T>;

  constructor(limit: number, private readonly onEvicted?: (item: T) => void) {
    this.volatile = new LRUMap(limit);
    this.volatile.shift = function () {
      const entry = LRUMap.prototype.shift.call(this);
      onEvicted?.(entry[1]);
      return entry;
    };
    this.durable = new Map();
  }

  get(key: string): T | undefined {
    const fromPersistent = this.durable.get(key);
    if (fromPersistent) {
      return fromPersistent;
    } else {
      return this.volatile.get(key);
    }
  }

  set(key: string, value: T): void {
    if (this.durable.has(key)) {
      this.durable.set(key, value);
    }
    this.volatile.set(key, value);
  }

  delete(key: string) {
    this.durable.delete(key);
    this.volatile.delete(key);
  }

  endure(key: string, value: T): void {
    this.durable.set(key, value);
    this.volatile.delete(key);
  }

  free(key: string) {
    const entry = this.durable.get(key);
    if (entry) {
      this.volatile.set(key, entry);
      this.durable.delete(key);
    }
  }

  *entries(): Generator<[string, T]> {
    for (const entry of this.durable.entries()) {
      yield entry;
    }
    for (const entry of this.volatile) {
      yield entry;
    }
  }

  *keys(): Generator<string> {
    for (const entry of this.entries()) {
      yield entry[0];
    }
  }

  *values(): Generator<T> {
    for (const entry of this.entries()) {
      yield entry[1];
    }
  }

  [Symbol.iterator]() {
    return this.entries();
  }
}
