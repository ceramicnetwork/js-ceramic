import { Observable, EMPTY, pipe, of, from, Subscription, UnaryFunction } from 'rxjs'
import { deserialize, PubsubMessage, serialize } from './pubsub-message'
import { IpfsApi } from '@ceramicnetwork/common'
import { map, catchError, mergeMap, withLatestFrom } from 'rxjs/operators'
import { IncomingChannel, filterExternal, IPFSPubsubMessage } from './incoming-channel'
import { DiagnosticsLogger, ServiceLogger } from '@ceramicnetwork/common'
import { TextDecoder } from 'util'

const textDecoder = new TextDecoder('utf-8')

/**
 * Deserialize incoming message in an internal observable that does not emit if error happens.
 * Log a successfully deserialized message.
 *
 * @param peerId$ - own IPFS node peer id
 * @param pubsubLogger - logger that dumps a successfully deserialized message
 * @param topic - IPFS pubsub topic we listen
 */
function ipfsToPubsub(
  peerId$: Observable<string>,
  pubsubLogger: ServiceLogger,
  topic: string
): UnaryFunction<Observable<IPFSPubsubMessage>, Observable<PubsubMessage>> {
  return pipe(
    withLatestFrom(peerId$),
    mergeMap(([incoming, peerId]) =>
      of(incoming).pipe(
        map((incoming) => {
          const message = deserialize(incoming)
          const serializedMessage = serialize(message)
          const logMessage = { ...incoming, ...JSON.parse(textDecoder.decode(serializedMessage)) }
          delete logMessage.key
          delete logMessage.signature
          pubsubLogger.log({ peer: peerId, event: 'received', topic: topic, message: logMessage })
          return message
        }),
        catchError(() => EMPTY)
      )
    )
  )
}

/**
 * Receive and publish messages to IPFS pubsub.
 */
export class Pubsub extends Observable<PubsubMessage> {
  private readonly peerId$: Observable<string>

  constructor(
    private readonly ipfs: IpfsApi,
    private readonly topic: string,
    private readonly resubscribeEvery: number,
    private readonly pubsubLogger: ServiceLogger,
    private readonly logger: DiagnosticsLogger
  ) {
    super((subscriber) => {
      const incoming$ = new IncomingChannel(ipfs, topic, resubscribeEvery, pubsubLogger, logger)

      incoming$
        .pipe(filterExternal(this.peerId$), ipfsToPubsub(this.peerId$, pubsubLogger, topic))
        .subscribe(subscriber)
    })
    // Textually, `this.peerId$` appears after it is called.
    // Really, subscription is lazy, so `this.peerId$` is populated before the actual subscription act.
    this.peerId$ = from<Promise<string>>(this.ipfs.id().then((_) => _.id))
  }

  /**
   * Publish message to IPFS Pubsub as a "fire and forget" command.
   *
   * You could use returned Subscription to react when the operation is finished.
   * Feel free to disregard it though.
   */
  next(message: PubsubMessage): Subscription {
    return this.peerId$
      .pipe(
        mergeMap(async (peerId) => {
          const serializedMessage = serialize(message)
          await this.ipfs.pubsub.publish(this.topic, serializedMessage)
          return { peerId, serializedMessage }
        })
      )
      .subscribe({
        next: ({ peerId, serializedMessage }) => {
          const logMessage = { ...message, ...JSON.parse(textDecoder.decode(serializedMessage)) }
          this.pubsubLogger.log({
            peer: peerId,
            event: 'published',
            topic: this.topic,
            message: logMessage,
          })
        },
        error: (error) => {
          this.logger.err(error)
        },
      })
  }
}
