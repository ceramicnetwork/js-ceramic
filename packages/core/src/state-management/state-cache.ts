import { LRUMap } from 'lru_map'

/**
 * Cache for RunningStates. Two buckets here: volatile and durable. Volatile is a LRUMap with a definite limit.
 * Durable bucket is just a simple map. One is expected to free a durable value when it is no longer needed.
 */
export class StateCache<T> implements Iterable<[string, T]> {
  readonly volatile: LRUMap<string, T>
  readonly durable: Map<string, T>

  /**
   * @param limit - LRUMap limit
   * @param onEvicted - what to do when an item is evicted from volatile cache.
   */
  constructor(limit: number, private readonly onEvicted?: (item: T) => void) {
    this.volatile = new LRUMap(limit)
    this.volatile.shift = function () {
      const entry = LRUMap.prototype.shift.call(this)
      onEvicted?.(entry[1])
      return entry
    }
    this.durable = new Map()
  }

  /**
   * Retrieve value, be it durable or volatile.
   */
  get(key: string): T | undefined {
    return this.durable.get(key) || this.volatile.get(key)
  }

  /**
   * Set value to volatile bucket. Update value in durable bucket, if present.
   */
  set(key: string, value: T): void {
    if (this.durable.has(key)) {
      this.durable.set(key, value)
    }
    this.volatile.set(key, value)
  }

  /**
   * Delete value from both volatile and durable buckers.
   */
  delete(key: string) {
    this.durable.delete(key)
    this.volatile.delete(key)
  }

  /**
   * Set value to durable bucket. Remove from volatile.
   */
  endure(key: string, value: T): void {
    this.durable.set(key, value)
    this.volatile.delete(key)
  }

  /**
   * Move value from durable to volatile bucket
   */
  free(key: string) {
    const entry = this.durable.get(key)
    if (entry) {
      this.volatile.set(key, entry)
      this.durable.delete(key)
    }
  }

  /**
   * Iterator over entries.
   */
  *entries(): Generator<[string, T]> {
    for (const entry of this.durable.entries()) {
      yield entry
    }
    for (const entry of this.volatile) {
      yield entry
    }
  }

  /**
   * Iterator over keys.
   */
  *keys(): Generator<string> {
    for (const entry of this.entries()) {
      yield entry[0]
    }
  }

  /**
   * Iterator over values.
   */
  *values(): Generator<T> {
    for (const entry of this.entries()) {
      yield entry[1]
    }
  }

  [Symbol.iterator]() {
    return this.entries()
  }
}
