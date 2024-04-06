import { ObjectStore } from './object-store.js'
import { StreamID } from '@ceramicnetwork/streamid'
import type { IKVFactory, IKVStoreFindResult, StoreSearchParams } from './ikv-store.js'
import { TaskQueue } from '../ancillary/task-queue.js'

function serializeStreamID(streamID: StreamID): string {
  return streamID.toString()
}

function deserializeStreamID(input: string): StreamID {
  return StreamID.fromString(input)
}

const DEFAULT_STALE_DURATION = 604_800_000 // 7 days in ms
const DEFAULT_CLEANUP_INTERVAL = 600_000 // 10 minutes in ms

/**
 * A storage for feed aggregation queue: key is a timestamp, value is StreamID.
 */
export class FeedAggregationStore extends ObjectStore<number, StreamID> {
  protected useCaseName = 'feed-aggregation'

  readonly staleDuration: number
  readonly cleanupInterval: number | null
  readonly tasks: TaskQueue
  #interval: NodeJS.Timeout | undefined

  constructor(
    staleDuration: number = DEFAULT_STALE_DURATION,
    cleanupInterval: number | null = DEFAULT_CLEANUP_INTERVAL
  ) {
    super(String, serializeStreamID, deserializeStreamID)
    this.staleDuration = staleDuration
    this.cleanupInterval = cleanupInterval
    this.tasks = new TaskQueue()
    this.#interval = undefined
  }

  findKeys(params?: Partial<StoreSearchParams>): Promise<Array<string>> {
    return this.store.findKeys(params)
  }

  find(params?: Partial<StoreSearchParams>): Promise<Array<IKVStoreFindResult>> {
    return this.store.find(params)
  }

  async deleteStale(lessThan: number): Promise<number> {
    const keys = await this.store.findKeys({ lt: String(lessThan) })
    if (keys.length > 0) {
      let batch = this.store.batch()
      for (const k of keys) {
        batch = batch.del(k)
      }
      await batch.write()
    }
    return keys.length
  }

  put(streamId: StreamID, timestamp: number = Date.now()): Promise<void> {
    return this.save(timestamp, streamId)
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

  async close(): Promise<void> {
    clearInterval(this.#interval)
    await this.tasks.onIdle()
    await super.close()
  }
}
