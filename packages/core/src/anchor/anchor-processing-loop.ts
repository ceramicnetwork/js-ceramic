import { ProcessingLoop } from './processing-loop.js'
import type { CASClient } from './anchor-service.js'
import type { AnchorRequestStore } from '../store/anchor-request-store.js'
import { AnchorRequestCarFileReader } from './anchor-request-car-file-reader.js'
import type { AnchorLoopHandler } from './anchor-service.js'
import type { DiagnosticsLogger } from '@ceramicnetwork/common'
import type { NamedTaskQueue } from '../state-management/named-task-queue.js'
import type { StreamID } from '@ceramicnetwork/streamid'
import { TimeableMetric, SinceField } from '@ceramicnetwork/observability'
import { ModelMetrics, Counter } from '@ceramicnetwork/model-metrics'
import { throttle } from 'lodash'
import { CID, Version } from 'multiformats'
import { interval } from 'rxjs'
import { startWith } from 'rxjs/operators'

const METRICS_REPORTING_INTERVAL_MS = 10000 // 10 second reporting interval

const DEFAULT_CONCURRENCY = 25

const CAS_REQUEST_POLLING_INTERVAL_MS = 1000 / 6 // 1000 ms divided by 6 calls

/**
 * Get anchor request entries from AnchorRequestStore one by one. For each entry, get CAS response,
 * and handle the response via `eventHandler.handle`.
 *
 * If CAS does not know about an anchor request, we consider it being not created previously for some reason.
 * We create a request on CAS then.
 */
export class AnchorProcessingLoop {
  readonly #loop: ProcessingLoop<StreamID>
  /**
   * Linearizes requests to AnchorRequestStore by stream id. Shared with the AnchorService.
   */
  readonly #anchorStoreQueue: NamedTaskQueue
  readonly #anchorPollingMetrics: TimeableMetric

  readonly #cas: CASClient
  // This function is throttled to limit its execution frequency to no more than once every CAS_REQUEST_POLLING_INTERVAL_MS.
  // It attempts to get the status of an anchor request from the CAS. If the request is not found, it logs a warning,
  // builds a new CAR file for the request, and submits a new request to the CAS.
  // The function is configured to execute only at the leading edge of the interval,
  // meaning it will execute immediately when called, but subsequent calls
  // within the CAS_REQUEST_POLLING_INTERVAL_MS will be ignored, ensuring that the CAS is not overwhelmed with too many
  // frequent requests and helping to manage system resources efficiently.
  throttledGetStatusForRequest = throttle(
    async (
      streamId: StreamID,
      cid: CID<unknown, number, number, Version>,
      cas: CASClient,
      logger: DiagnosticsLogger,
      eventHandler: AnchorLoopHandler
    ) => {
      return cas.getStatusForRequest(streamId, cid).catch(async (error) => {
        logger.warn(`No request present on CAS for ${cid} of ${streamId}: ${error}`)
        const requestCAR = await eventHandler.buildRequestCar(streamId, cid)
        return cas.create(new AnchorRequestCarFileReader(requestCAR))
      })
    },
    CAS_REQUEST_POLLING_INTERVAL_MS, // Set the maximum frequency of function execution
    { trailing: false } // Execute only at the leading edge of the interval
  )
  intervalSubscription: any

  // This method dynamically adjusts the polling interval based on the current rate of create requests.
  // It calculates a new interval using a square root function to moderate the change rate, ensuring the interval
  // remains within predefined maximum and minimum bounds. The adjusted interval is then applied to throttle
  // the `throttledGetStatusForRequest` function, which controls the frequency of status checks and request submissions
  // to the CAS, enhancing system responsiveness and stability.
  private adjustPollingInterval(): void {
    const currentRate = this.#cas.getCreateRequestRate()

    const maxInterval = 200 // maximum interval in ms (equivalent to 1000/5) ~ 5 tps
    const minInterval = 5 // minimum interval in ms (equivalent to 1000 / 200 ) ~ 200 tps

    let newInterval = 1000 / Math.sqrt(currentRate + 1)

    // Ensure the interval is within bounds
    newInterval = Math.min(Math.max(newInterval, minInterval), maxInterval)

    this.throttledGetStatusForRequest = throttle(this.throttledGetStatusForRequest, newInterval, {
      trailing: false,
    })
  }

  constructor(
    batchSize: number,
    cas: CASClient,
    store: AnchorRequestStore,
    logger: DiagnosticsLogger,
    eventHandler: AnchorLoopHandler,
    anchorStoreQueue: NamedTaskQueue
  ) {
    this.#anchorStoreQueue = anchorStoreQueue
    this.#anchorPollingMetrics = new TimeableMetric(
      SinceField.TIMESTAMP,
      'anchorRequestAge',
      METRICS_REPORTING_INTERVAL_MS
    )
    this.#cas = cas
    const concurrency =
      Number(process.env.CERAMIC_ANCHOR_POLLING_CONCURRENCY) || DEFAULT_CONCURRENCY
    this.#loop = new ProcessingLoop(
      logger,
      concurrency,
      store.infiniteList(batchSize),
      async (streamId) => {
        try {
          logger.verbose(
            `Loading pending anchor metadata for Stream ${streamId} from AnchorRequestStore`
          )
          const entry = await store.load(streamId)
          const event = await this.throttledGetStatusForRequest(
            streamId,
            entry.cid,
            this.#cas,
            logger,
            eventHandler
          )
          const isTerminal = await eventHandler.handle(event)
          logger.verbose(
            `Anchor event with status ${event.status} for commit CID ${entry.cid} of Stream ${streamId} handled successfully`
          )
          if (isTerminal) {
            // Record the latency of how long this particular anchor request existed in the
            // AnchorRequestStore.  The "record" function will compare the current time to the
            // "timestamp" field from "entry", which was set as the current time when the request was
            // first written into the AnchorRequestStore.
            this.#anchorPollingMetrics.record(entry)
            ModelMetrics.recordAnchorRequestAgeMS(entry)
            ModelMetrics.count(Counter.RECENT_COMPLETED_REQUESTS, 1)

            // Remove iff tip stored equals to the tip we processed
            // Sort of Compare-and-Swap.
            await this.#anchorStoreQueue.run(streamId.toString(), async () => {
              const loaded = await store.load(streamId)
              if (loaded.cid.equals(entry.cid)) {
                await store.remove(streamId)
                logger.verbose(
                  `Entry from AnchorRequestStore for Stream ${streamId} removed successfully`
                )
              }
            })
          }
        } catch (err) {
          const err_msg = `Error while processing entry from the AnchorRequestStore for StreamID ${streamId}: ${err}`
          logger.err(err_msg)
          ModelMetrics.recordError(err_msg)

          // Swallow the error and leave the entry in the store, it will get retries the next time through the loop.
        }
      }
    )
  }

  /**
   * Start looping.
   */
  start(): void {
    this.#anchorPollingMetrics.startPublishingStats()
    void this.#loop.start()

    // Set up an interval to adjust the polling interval every 10 minutes (600000 milliseconds)
    const subscription = interval(600000)
      .pipe(
        startWith(0) // to start immediately
      )
      .subscribe(() => {
        this.adjustPollingInterval()
      })

    this.intervalSubscription = subscription
  }

  /**
   * Stop looping.
   */
  async stop(): Promise<void> {
    this.#anchorPollingMetrics.stopPublishingStats()
    this.intervalSubscription?.unsubscribe()
    return this.#loop.stop()
  }
}
