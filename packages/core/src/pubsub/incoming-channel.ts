import { Observable } from 'rxjs'
import type { IpfsApi } from '@ceramicnetwork/common'
import { DiagnosticsLogger, ServiceLogger } from '@ceramicnetwork/common'
import { pipe, MonoTypeOperatorFunction } from 'rxjs'
import { map, filter, concatMap, retryWhen, tap, delay } from 'rxjs/operators'
import { TaskQueue } from '../ancillary/task-queue.js'
import type { SignedMessage, Message } from '@libp2p/interface-pubsub'

/**
 * Subscription attempts must be sequential, in FIFO order.
 * Last call to unsubscribe must execute after all the attempts are done,
 * and all the attempts yet inactive are cleared. Serialized via TaskQueue.
 */
export class PubsubIncoming extends Observable<Message> {
  constructor(
    readonly ipfs: IpfsApi,
    readonly topic: string,
    readonly pubsubLogger: ServiceLogger,
    readonly logger: DiagnosticsLogger,
    readonly tasks: TaskQueue
  ) {
    super((subscriber) => {
      const onMessage = (message: Message) => subscriber.next(message)
      const onError = (error: Error) => subscriber.error(error)

      // For some reason ipfs.id() throws an error directly if the
      // ipfs node can't be reached, while pubsub.subscribe stalls
      // for an unknown amount of time. We therefor run ipfs.id()
      // first to determine if the ipfs node is reachable.
      this.tasks
        .run(async () => {
          const ipfsId = await this.ipfs.id()
          const peerId = ipfsId.id
          await ipfs.pubsub.subscribe(topic, onMessage, { onError })
          pubsubLogger.log({ peer: peerId, event: 'subscribed', topic: topic })
        })
        .catch(onError)

      return () => {
        this.tasks.clear()
        this.tasks.add(async () => {
          await ipfs.pubsub?.unsubscribe(topic, onMessage).catch((err) => {
            this.logger.warn(err)
          })
        })
      }
    })
    this.tasks = new TaskQueue()
  }
}

/**
 * Incoming IPFS PubSub message stream as Observable.  Adds retry logic on top of base PubsubIncoming.
 */
export class IncomingChannel extends Observable<Message> {
  constructor(
    readonly ipfs: IpfsApi,
    readonly topic: string,
    readonly resubscribeEvery: number,
    readonly lateMessageAfter: number,
    readonly pubsubLogger: ServiceLogger,
    readonly logger: DiagnosticsLogger,
    readonly tasks: TaskQueue = new TaskQueue()
  ) {
    super((subscriber) => {
      const subscription = new PubsubIncoming(ipfs, topic, pubsubLogger, logger, this.tasks)
        .pipe(
          checkSlowObservable(
            lateMessageAfter,
            logger,
            'IPFS did not provide any messages, please check your IPFS configuration and ensure your node is well connected to the rest of the Ceramic network.'
          ),
          retryWhen((errors) =>
            errors.pipe(
              tap((e) => logger.err(e)),
              delay(resubscribeEvery)
            )
          )
        )
        .subscribe(subscriber)

      return () => {
        subscription.unsubscribe()
      }
    })
  }
}

/**
 * Pass only messages from other IPFS nodes.
 * @param ownPeerId$ - Own peer id.
 */
export function filterExternal(
  ownPeerId$: Observable<string>
): MonoTypeOperatorFunction<SignedMessage> {
  return pipe(
    filter((message) => message.type === 'signed'),
    concatMap((data: SignedMessage) => {
      return ownPeerId$.pipe(
        map((peerId) => {
          return { isOuter: data.from.toString() !== peerId, entry: data }
        })
      )
    }),
    // Filter the container object synchronously for the value in each data container object
    filter((data) => data.isOuter),
    // remove the data container object from the observable chain
    map((data) => data.entry)
  )
}

export function checkSlowObservable(
  delay: number,
  logger: DiagnosticsLogger,
  description: string
): MonoTypeOperatorFunction<Message> {
  const createTimeout = () => {
    return setTimeout(() => {
      logger.warn(`Did not receive any pubsub messages in more than ${delay}ms. ${description}`)
    }, delay)
  }
  let outstanding = createTimeout()
  return pipe(
    tap({
      next: () => {
        clearTimeout(outstanding)
        outstanding = createTimeout()
      },
      complete: () => clearTimeout(outstanding),
    })
  )
}
