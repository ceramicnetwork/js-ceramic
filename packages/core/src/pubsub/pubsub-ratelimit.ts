import { from, Observable, Subscription } from 'rxjs'
import { MsgType, PubsubMessage } from './pubsub-message'
import { Pubsub } from './pubsub'
import { TaskQueue } from './task-queue'
import { DiagnosticsLogger } from '@ceramicnetwork/common'
import { ClockSource } from '../clock-source'
import { ObservableWithNext } from './observable-with-next'

/**
 * Wraps an instance of Pubsub and rate limits how often QUERY messages can be sent.  There are two
 * main configuration parameters: 'queriesPerSecond' and 'maxQueuedQueries'. 'queriesPerSecond'
 * controls how many QUERY pubsub messages can be published per second.  If more than that number
 * of query messages are attempted to be published, additional messages will queue up and will be
 * published when doing so will no longer put us over 'queriesPerSecond'.  'maxQueuedQueries'
 * controls how many queries are allowed to queue up before further attempts to publish query
 * messages just start failing outright.
 *
 * Note that other types of pubsub messages that are not QUERY messages are allowed to be published
 * without limit.
 */
export class PubsubRateLimit
  extends Observable<PubsubMessage>
  implements ObservableWithNext<PubsubMessage>
{
  /**
   * List of timestamps of the most recent queries. Will grow to be at max this.queriesPerSecond in length.
   * @private
   */
  private readonly _recentQueries: Date[] = []

  /**
   * A fixed-size task queue for QUERY message publish tasks. There is a limit to the max number
   * of QUERY messages that can queue up, after which point publishing new query messages will start
   * to fail
   * @private
   */
  private readonly _queryQueue: TaskQueue

  /**
   * An abstraction around accessing the system clock, to allow injecting mock behavior in unit tests.
   * @private
   */
  private readonly _clock: ClockSource = new ClockSource()

  /**
   * Constructs a new instance of PubsubRateLimit.
   * @param pubsub - the underlying Pubsub instance to publish messages to.
   * @param logger
   * @param queriesPerSecond - Max number of query messages that can be published per second
   *   before they start to queue up.
   * @param maxQueuedQueries - Max number of messages that are allowed in the queue.
   */
  constructor(
    private readonly pubsub: ObservableWithNext<PubsubMessage>,
    private readonly logger: DiagnosticsLogger,
    private readonly queriesPerSecond: number,
    private readonly maxQueuedQueries: number
  ) {
    super((subscriber) => {
      pubsub.subscribe(subscriber)
    })

    this._queryQueue = new TaskQueue((err) => {
      this.logger.err(`Error while publishing pubsub QUERY message: ${err}`)
    }, maxQueuedQueries)
  }

  /**
   * For non-query messages simply passes the message directly through to pubsub. For query messages,
   * queues the messages up to be published so long as we aren't exceeding the rate limit.
   * @param message
   */
  next(message: PubsubMessage): Subscription {
    if (message.typ === MsgType.QUERY) {
      try {
        return from(this._queryQueue.run(this._publishQuery.bind(this, message))).subscribe()
      } catch (err) {
        // Convert error message to something more descriptive
        throw new Error(
          `Cannot publish query message to pubsub because we have exceeded the maximum allowed rate: ${err}`
        )
      }
    } else {
      return this.pubsub.next(message)
    }
  }

  /**
   * Helper method for publishing a query to pubsub that only publishes the message once there have
   * been fewer than this.queriesPerSecond queries published in the last second.
   * @param message
   * @private
   */
  private async _publishQuery(message: PubsubMessage): Promise<Subscription> {
    if (this._recentQueries.length >= this.queriesPerSecond) {
      const now = this._clock.now()
      const oldestQuery = this._recentQueries.shift()
      const timeSinceOldestQuery = now.getTime() - oldestQuery.getTime()
      if (timeSinceOldestQuery < 1000) {
        // If it's been less than a second since the oldest query, sleep until it's been more than a
        // second
        this.logger.warn(
          `More than ${this.queriesPerSecond} query messages published in less than a second. Query messages will be rate limited`
        )
        await this._clock.waitUntil(new Date(oldestQuery.getTime() + 1000))
      }
    }

    this._recentQueries.push(this._clock.now())
    return this.pubsub.next(message)
  }
}
