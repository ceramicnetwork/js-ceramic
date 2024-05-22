import { ObjectStore } from './object-store.js'
import { StreamID } from '@ceramicnetwork/streamid'
import type { IKVFactory, IKVStoreFindResult, StoreSearchParams } from './ikv-store.js'
import { TaskQueue } from '../ancillary/task-queue.js'
import { Observable, firstValueFrom, Subject } from 'rxjs'
import type { DiagnosticsLogger } from '@ceramicnetwork/common'
import * as process from 'node:process'

function serializeStreamID(streamID: StreamID): string {
  return streamID.toString()
}

function deserializeStreamID(input: string): StreamID {
  return StreamID.fromString(input)
}

const DEFAULT_STALE_DURATION = 604_800_000 // 7 days in ms
const DEFAULT_CLEANUP_INTERVAL = 600_000 // 10 minutes in ms

export type AggregationStoreEntry = {
  resumeToken: string
  streamID: StreamID
}

/**
 * Monotonically increasing counter: current time in ms + six digits of a counter.
 * The counter gets incremented if `next` is called during the same millisecond.
 */
export class MonotonicKey {
  #previous = Date.now()
  #counter = 0

  /**
   * Retrieve the next key.
   */
  next(now = Date.now()): string {
    if (this.#previous === now) {
      const counter = this.#counter++
      return `${this.#previous}${counter.toString().padStart(6, '0')}`
    } else {
      this.#counter = 1
      this.#previous = now
      return `${this.#previous}000000`
    }
  }
}

/**
 * A storage for feed aggregation queue: key is a timestamp, value is StreamID.
 */
export class FeedAggregationStore extends ObjectStore<string, StreamID> {
  protected useCaseName = 'feed-aggregation'
  readonly staleDuration: number
  readonly cleanupInterval: number | null
  readonly tasks: TaskQueue
  readonly #keyGenerator = new MonotonicKey()
  #interval: NodeJS.Timeout | undefined
  private readonly onWrite: Subject<void>

  constructor(
    private readonly logger: DiagnosticsLogger,
    staleDuration: number = DEFAULT_STALE_DURATION,
    cleanupInterval: number | null = DEFAULT_CLEANUP_INTERVAL
  ) {
    super(String, serializeStreamID, deserializeStreamID)
    this.staleDuration = staleDuration
    this.cleanupInterval = cleanupInterval
    this.tasks = new TaskQueue()
    this.#interval = undefined
    this.find = this.find.bind(this)
    this.onWrite = new Subject()
  }

  findKeys(params?: Partial<StoreSearchParams>): Promise<Array<string>> {
    return this.store.findKeys(params)
  }

  find(params?: Partial<StoreSearchParams>): Promise<Array<IKVStoreFindResult>> {
    return this.store.find(params)
  }

  /**
   * Delete entries older than `lessThanMS`.
   *
   * @param lessThanMs - Unix timestamp in millisecond. Older entries got deleted.
   */
  async deleteStale(lessThanMs: number): Promise<number> {
    const keys = await this.store.findKeys({ lt: String(lessThanMs * 1000) })
    if (keys.length > 0) {
      let batch = this.store.batch()
      for (const k of keys) {
        batch = batch.del(k)
      }
      await batch.write()
    }
    return keys.length
  }

  async put(streamId: StreamID, key: string = this.#keyGenerator.next()): Promise<void> {
    await this.save(key, streamId)
    this.logger.warn(`Inserting this streamId from LevelDB ${streamId} at ${Date.now()}`)
    this.onWrite.next()
  }

  async open(factory: Pick<IKVFactory, 'open'>): Promise<void> {
    await super.open(factory)
    if (this.cleanupInterval) {
      this.#interval = setInterval(() => {
        if (this.tasks.size > 0) return
        this.tasks.add(async () => {
          const threshold = Date.now() - this.staleDuration
          await this.deleteStale(threshold)
        })
      }, this.cleanupInterval)
    }
  }

  streamIDs(gt?: string): ReadableStream<AggregationStoreEntry> {
    const source = new StreamIDFeedSource(this.find, this.onWrite.asObservable(), this.logger, gt)
    return new ReadableStream(source)
  }

  async close(): Promise<void> {
    clearInterval(this.#interval)
    await this.tasks.onIdle()
    await super.close()
  }
}

class StreamIDFeedSource implements UnderlyingSource<AggregationStoreEntry> {
  /**
   * Opaque token that stores current position in the feed. Used as a resumability token.
   */
  private token: string

  constructor(
    private readonly find: FeedAggregationStore['find'],
    private readonly onWrite: Observable<void>,
    private readonly logger: DiagnosticsLogger,
    token: string = new MonotonicKey().next()
  ) {
    this.token = token
  }

  async pull(controller: ReadableStreamController<AggregationStoreEntry>) {
    const entries = await this.find({ limit: controller.desiredSize, gt: this.token })
    if (entries.length === 0) {
      await firstValueFrom(this.onWrite)
      return this.pull(controller)
    }
    for (const entry of entries) {
      this.logger.warn(`Sending this streamId from LevelDB ${entry.value} at ${Date.now()}`)
      controller.enqueue({
        resumeToken: entry.key,
        streamID: entry.value,
      })
    }
    this.token = entries[entries.length - 1].key
  }
}
