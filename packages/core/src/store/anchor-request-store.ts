import { StreamID } from '@ceramicnetwork/streamid'
import { ObjectStore } from './object-store.js'
import { CID } from 'multiformats/cid'
import { StreamUtils, type DiagnosticsLogger, type GenesisCommit } from '@ceramicnetwork/common'
import { ServiceMetrics as Metrics } from '@ceramicnetwork/observability'

// How long to wait for the store to return a batch from a find request.
const DEFAULT_BATCH_TIMEOUT_MS = 60 * 1000 // 1 minute
const ANCHOR_POLLING_PROCESSED = 'anchor_polling_processed'
const DEFAULT_MIN_LOOP_JITTER_MS = 100

export type AnchorRequestData = {
  cid: CID
  timestamp: number
  genesis: GenesisCommit
}

export type AnchorRequestStoreListResult = {
  key: StreamID
  value: AnchorRequestData
}

function generateKey(object: undefined): undefined
function generateKey(object: StreamID): string
function generateKey(object: StreamID | undefined): string | undefined {
  if (object) {
    return object.toString()
  } else {
    return undefined
  }
}

export function serializeAnchorRequestData(value: AnchorRequestData): any {
  return JSON.stringify({
    cid: value.cid.toString(),
    timestamp: value.timestamp,
    genesis: StreamUtils.serializeCommit(value.genesis),
  })
}

export function deserializeAnchorRequestData(serialized: any): AnchorRequestData {
  const parsed = JSON.parse(serialized)
  return {
    cid: CID.parse(parsed.cid),
    timestamp: parsed.timestamp,
    genesis: StreamUtils.deserializeCommit(parsed.genesis),
  }
}

async function sleepOrAbort(timeoutMS: number, abortSignal: AbortSignal): Promise<void> {
  let timeout
  let listener
  return new Promise<void>((resolve) => {
    if (abortSignal.aborted) {
      return resolve()
    }

    listener = () => {
      resolve()
    }
    abortSignal.addEventListener('abort', listener)

    timeout = setTimeout(() => {
      resolve()
    }, timeoutMS)
  }).then(() => {
    clearTimeout(timeout)
    abortSignal.removeEventListener('abort', listener)
  })
}

/**
 * An object-value store being able to save, retrieve and delete anchor request data identified by stream ids
 *
 * Anchor request data includes everything that's necessary to request an anchor from Ceramic Anchoring Service (CAS).
 * This store is used to save and retrieve this data so that it can be re-sent to CAS in case of networking issues.
 */
export class AnchorRequestStore extends ObjectStore<StreamID, AnchorRequestData> {
  readonly useCaseName = 'anchor-requests'
  #shouldStop: boolean
  #abortController: AbortController
  #logger: DiagnosticsLogger
  // This timeout currently only applies to batches within the infiniteList() function
  // TODO: Add a timeout to regular find() calls as well.
  readonly #infiniteListBatchTimeoutMs: number
  /**
   * If the number of entries in the store is small, iterating over all of them could happen very
   * quickly.  We don't want to spam the CAS too much, so we enforce a minimum amount of time a loop
   * must take before we restart iterating from the beginning.
   */
  readonly #minLoopDurationMs: number
  readonly #minLoopJitterMs: number

  constructor(
    logger: DiagnosticsLogger,
    minLoopDurationMs,
    infiniteListBatchTimeoutMs = DEFAULT_BATCH_TIMEOUT_MS,
    minLoopJitterMS = DEFAULT_MIN_LOOP_JITTER_MS
  ) {
    super(generateKey, serializeAnchorRequestData, deserializeAnchorRequestData)
    this.#logger = logger
    this.#infiniteListBatchTimeoutMs = infiniteListBatchTimeoutMs
    this.#abortController = new AbortController()
    this.#minLoopDurationMs = minLoopDurationMs
    this.#minLoopJitterMs = minLoopJitterMS
  }

  exists(key: StreamID): Promise<boolean> {
    return this.store.exists(generateKey(key))
  }

  async *list(batchSize = 1): AsyncIterable<Array<AnchorRequestStoreListResult>> {
    let gt: StreamID | undefined = undefined
    do {
      // TODO: Add timeout to the query
      const batch = await this.store.find({
        limit: batchSize,
        gt: generateKey(gt),
      })
      if (batch.length > 0) {
        gt = StreamID.fromString(batch[batch.length - 1].key)
        yield batch.map((item) => {
          return {
            key: StreamID.fromString(item.key),
            value: deserializeAnchorRequestData(item.value),
          }
        })
      } else {
        return
      }
    } while (true)
  }

  /**
   * Continuously emit entries of AnchorRequestStore in an infinite loop.
   *
   * @param batchSize - The number of items per batch.
   * @returns An async generator that yields entries.
   */
  async *infiniteList(batchSize = 1): AsyncGenerator<StreamID> {
    let gt: StreamID | undefined = undefined
    let numEntries = 0
    do {
      const loopStartTime = new Date()
      try {
        let timeout
        const timeoutPromise = new Promise<null>((resolve) => {
          timeout = setTimeout(() => {
            this.#logger.warn(`Timed out while waiting for AnchorRequestStore to fetch a batch`)
            resolve(null)
          }, this.#infiniteListBatchTimeoutMs)
        })
        this.#logger.verbose(`Fetching batch from AnchorRequestStore starting at key ${gt}`)
        const batchPromise = this.store.find({
          limit: batchSize,
          gt: generateKey(gt),
        })
        const batch = await Promise.race([batchPromise, timeoutPromise])
        clearTimeout(timeout)
        if (batch && batch.length > 0) {
          gt = StreamID.fromString(batch[batch.length - 1].key)
          for (const item of batch) {
            numEntries++
            yield StreamID.fromString(item.key)
          }
        } else {
          this.#logger.debug(
            `Anchor polling loop processed ${numEntries} entries from the AnchorRequestStore. Restarting loop.`
          )
          Metrics.observe(ANCHOR_POLLING_PROCESSED, numEntries)

          // If we iterated over all entries in the store in less time than the minLoopDuration,
          // sleep to avoid spamming the CAS.
          const loopEndTime = new Date()
          // jest sometimes does weird things with time so abs is necessary
          const loopDurationMs = Math.abs(loopEndTime.getTime() - loopStartTime.getTime())
          if (this.#minLoopDurationMs === 0) {
            await sleepOrAbort(this.#minLoopJitterMs, this.#abortController.signal)
          } else if (loopDurationMs < this.#minLoopDurationMs) {
            const remainingLoopDuration = this.#minLoopDurationMs - loopDurationMs
            if (remainingLoopDuration > this.#minLoopJitterMs) {
              await sleepOrAbort(remainingLoopDuration, this.#abortController.signal)
            }
          }

          gt = undefined
          numEntries = 0
        }
      } catch (err) {
        this.#logger.err(`Error querying the AnchorRequestStore: ${err}`)
      }
    } while (!this.#shouldStop)
    this.#logger.debug(`AnchorRequestStore processing loop shutting down`)
  }

  async close() {
    this.#logger.debug(`Closing AnchorRequestStore`)
    this.#shouldStop = true
    this.#abortController.abort()
    await super.close()
  }
}
