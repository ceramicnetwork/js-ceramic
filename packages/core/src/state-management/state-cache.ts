import { LRUMap } from 'lru_map';

export class StateCache<T> implements Iterable<[string, T]> {
  readonly volatile: LRUMap<string, T>;
  readonly persistent: Map<string, T>;

  constructor(limit: number, private readonly onEvicted?: (item: T) => void) {
    this.volatile = new LRUMap(limit);
    this.volatile.shift = function () {
      const entry = LRUMap.prototype.shift.call(this);
      onEvicted?.(entry[1]);
      return entry;
    };
    this.persistent = new Map();
  }

  get(key: string): T | undefined {
    const fromPersistent = this.persistent.get(key);
    if (fromPersistent) {
      return fromPersistent;
    } else {
      return this.volatile.get(key);
    }
  }

  set(key: string, value: T): void {
    this.volatile.set(key, value);
  }

  persist(key: string, value: T): void {
    this.persistent.set(key, value);
    this.volatile.delete(key);
  }

  free(key: string) {
    const entry = this.persistent.get(key);
    if (entry) {
      this.volatile.set(key, entry);
      this.persistent.delete(key);
    }
  }

  *entries(): Generator<[string, T]> {
    for (const entry of this.persistent.entries()) {
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
