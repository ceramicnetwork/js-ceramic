import { NamedTaskQueue } from './named-task-queue';

const NEWER = Symbol('newer');
const OLDER = Symbol('older');

class Entry<A> {
  [NEWER]: Entry<A> | undefined;
  [OLDER]: Entry<A> | undefined;

  constructor(readonly key: string, public value: A) {}
}

const noop = async () => {
  // Do Nothing
};

/**
 * LRU Map with add/set/delete operations linearized per key.
 */
export class AsyncLruMap<A> {
  size: number;
  _keymap: Map<string, Entry<A>> = new Map();
  newest?: Entry<A>;
  oldest?: Entry<A>;
  sync: NamedTaskQueue;

  constructor(
    public readonly limit: number,
    private readonly onEvicted: (entry: Entry<A>) => Promise<void> = noop,
    sync: NamedTaskQueue = new NamedTaskQueue(),
  ) {
    this.size = 0;
    this.sync = sync;
  }

  private markEntryAsUsed(entry: Entry<A>): void {
    if (entry === this.newest) {
      // Already the most recenlty used entry, so no need to update the list
      return;
    }
    // HEAD--------------TAIL
    //   <.older   .newer>
    //  <--- add direction --
    //   A  B  C  <D>  E
    if (entry[NEWER]) {
      if (entry === this.oldest) {
        this.oldest = entry[NEWER];
      }
      entry[NEWER][OLDER] = entry[OLDER]; // C <-- E.
    }
    if (entry[OLDER]) {
      entry[OLDER][NEWER] = entry[NEWER]; // C. --> E
    }
    entry[NEWER] = undefined; // D --x
    entry[OLDER] = this.newest; // D. --> E
    if (this.newest) {
      this.newest[NEWER] = entry; // E. <-- D
    }
    this.newest = entry;
  }

  async get(key: string): Promise<A | undefined> {
    return this.sync.run(key, async () => {
      // First, find our cache entry
      const entry = this._keymap.get(key);
      if (!entry) return; // Not cached. Sorry.
      // As <key> was found in the cache, register it as being requested recently
      this.markEntryAsUsed(entry);
      return entry.value;
    });
  }

  async set(key: string, value: A): Promise<AsyncLruMap<A>> {
    return this.sync.run(key, async () => {
      let entry = this._keymap.get(key);

      if (entry) {
        // update existing
        entry.value = value;
        this.markEntryAsUsed(entry);
        return this;
      }

      // new entry
      this._keymap.set(key, (entry = new Entry(key, value)));

      if (this.newest) {
        // link previous tail to the new tail (entry)
        this.newest[NEWER] = entry;
        entry[OLDER] = this.newest;
      } else {
        // we're first in -- yay
        this.oldest = entry;
      }

      // add new entry to the end of the linked list -- it's now the freshest entry.
      this.newest = entry;
      ++this.size;
      if (this.size > this.limit) {
        // we hit the limit -- remove the head
        await this.shift();
      }

      return this;
    });
  }

  async shift() {
    // todo: handle special case when limit == 1
    const entry = this.oldest;
    if (entry) {
      if (this.oldest[NEWER]) {
        // advance the list
        this.oldest = this.oldest[NEWER];
        this.oldest[OLDER] = undefined;
      } else {
        // the cache is exhausted
        this.oldest = undefined;
        this.newest = undefined;
      }
      // Remove last strong reference to <entry> and remove links from the purged
      // entry being returned:
      entry[NEWER] = entry[OLDER] = undefined;
      this._keymap.delete(entry.key);
      --this.size;
      await this.onEvicted(entry);
      return [entry.key, entry.value];
    }
  }

  async delete(key: string): Promise<A> {
    return this.sync.run(key, async () => {
      const entry = this._keymap.get(key);
      if (!entry) return;
      this._keymap.delete(entry.key);
      if (entry[NEWER] && entry[OLDER]) {
        // relink the older entry with the newer entry
        entry[OLDER][NEWER] = entry[NEWER];
        entry[NEWER][OLDER] = entry[OLDER];
      } else if (entry[NEWER]) {
        // remove the link to us
        entry[NEWER][OLDER] = undefined;
        // link the newer entry to head
        this.oldest = entry[NEWER];
      } else if (entry[OLDER]) {
        // remove the link to us
        entry[OLDER][NEWER] = undefined;
        // link the newer entry to head
        this.newest = entry[OLDER];
      } else {
        // if(entry[OLDER] === undefined && entry.newer === undefined) {
        this.oldest = this.newest = undefined;
      }

      this.size--;
      return entry.value;
    });
  }

  [Symbol.iterator]() {
    return new EntryIterator(this.oldest);
  }

  /**
   * String representation.
   */
  toString() {
    let s = '',
      entry = this.oldest;
    while (entry) {
      s += String(entry.key) + ':' + entry.value;
      entry = entry[NEWER];
      if (entry) {
        s += ' < ';
      }
    }
    return s;
  }
}

export class EntryIterator<A> implements Iterator<[string, A]> {
  constructor(private entry: Entry<A>) {}

  [Symbol.iterator]() {
    return this;
  }

  next(): { done: false; value: [string, A] } | { done: true; value: undefined } {
    const entry = this.entry;
    if (entry) {
      this.entry = entry[NEWER];
      return { done: false, value: [entry.key, entry.value] as [string, A] };
    } else {
      return { done: true, value: undefined };
    }
  }
}
