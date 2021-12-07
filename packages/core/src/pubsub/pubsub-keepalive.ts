import { Observable, Subscription, interval } from 'rxjs'
import { KeepaliveMessage, MsgType, PubsubMessage } from './pubsub-message'
import { ObservableWithNext } from './observable-with-next'

/**
 * Wraps an instance of Pubsub and ensures that a pubsub message is generated with some minimum
 * frequency.
 */
export class PubsubKeepalive
  extends Observable<PubsubMessage>
  implements ObservableWithNext<PubsubMessage>
{
  private lastPublishedMessageDate: number = Date.now() - this.maxPubsubPublishInterval

  /**
   * Given a 'maxPubsubPublishInterval' specifying the max amount of time between pubsub messages,
   *   starts a background job that runs every maxPubsubPublishInterval/2 and publishes a keepalive
   *   message if no other pubsub messages have been sent within maxPubsubPublishInterval/2. Running
   *   the check in an interval half as long as the max limit, and publishing a message if we have
   *   less than half the max limit interval remaining, guarantees that even in the worst case we
   *   never pass 'maxPubsubPublishInterval' without publishing a message.
   * @param pubsub - Pubsub instances used to publish messages to the underlying libp2p pubsub topic.
   * @param maxPubsubPublishInterval - the max amount of time that is allowed to pass without
   *   generating a pubsub message.
   */
  constructor(
    private readonly pubsub: ObservableWithNext<PubsubMessage>,
    private readonly maxPubsubPublishInterval: number
  ) {
    super((subscriber) => {
      pubsub.subscribe(subscriber)

      // Start background job to periodically send pubsub messages if no other messages have been
      // sent recently.
      const pubsubKeepaliveInterval = interval(this.maxPubsubPublishInterval / 2).subscribe(() => {
        this.publishPubsubKeepaliveIfNeeded()
      })

      return () => {
        pubsubKeepaliveInterval.unsubscribe()
      }
    })
  }

  /**
   * Passes on the message to be published by the underlying Pubsub instance, while keeping
   * track of the fact that we sent a message and thus can reset our idea of when the next keepalive
   * message needs to be sent.
   */
  next(message: PubsubMessage): Subscription {
    this.lastPublishedMessageDate = Date.now()
    return this.pubsub.next(message)
  }

  /**
   * Called periodically and ensures that if we haven't published a pubsub message in too long,
   * we'll publish one so that we never go longer than MAX_PUBSUB_PUBLISH_INTERVAL without
   * publishing a pubsub message.  This is to work around a bug in IPFS where peer connections
   * get dropped if they haven't had traffic in too long.
   */
  publishPubsubKeepaliveIfNeeded(): void {
    const now = Date.now()
    if (now - this.lastPublishedMessageDate < this.maxPubsubPublishInterval / 2) {
      // We've published a message recently enough, no need to publish another
      return
    }

    const message: KeepaliveMessage = { typ: MsgType.KEEPALIVE, ts: now }
    this.next(message)
  }
}
