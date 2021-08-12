import { Observable, Subscription } from 'rxjs'
import { KeepaliveMessage, MsgType, PubsubMessage } from './pubsub-message'
import { Pubsub } from './pubsub'

/**
 * Wraps an instance of Pubsub and ensures that a pubsub message is generated with some minimum
 * frequency.
 */
export class PubsubKeepalive extends Observable<PubsubMessage> {
  private lastPublishedMessageDate: number = Date.now() - this.maxPubsubPublishInterval

  constructor(private readonly pubsub: Pubsub, private readonly maxPubsubPublishInterval: number) {
    super((subscriber) => {
      pubsub.subscribe(subscriber)

      // Start background job to periodically send pubsub messages if no other messages have been
      // sent recently.
      const pubsubKeepaliveInterval = setInterval(
        this.publishPubsubKeepaliveIfNeeded.bind(this),
        this.maxPubsubPublishInterval / 2
      )

      // todo use rxjs interval
      return () => {
        clearInterval(pubsubKeepaliveInterval)
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
