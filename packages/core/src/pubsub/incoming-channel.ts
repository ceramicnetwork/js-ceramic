import { Observable } from 'rxjs'
import type { IpfsApi } from '@ceramicnetwork/common'
import { DiagnosticsLogger, ServiceLogger } from '@ceramicnetwork/common'
import { pipe, MonoTypeOperatorFunction } from 'rxjs'
import { map, filter, concatMap, retryWhen, tap, delay } from 'rxjs/operators'
import { TaskQueue } from './task-queue.js'

// Typestub for pubsub message.
// At some future time this type definition should be provided by IPFS.
export type IPFSPubsubMessage = {
  from: string
  seqno: Uint8Array
  data: Uint8Array
  topicIDs: string[]
  signature: Uint8Array
  key: Uint8Array
}

/**
 * Subscription attempts must be sequential, in FIFO order.
 * Last call to unsubscribe must execute after all the attempts are done,
 * and all the attempts yet inactive are cleared. Serialized via TaskQueue.
 */
export class PubsubIncoming extends Observable<IPFSPubsubMessage> {
  constructor(
    readonly ipfs: IpfsApi,
    readonly topic: string,
    readonly pubsubLogger: ServiceLogger,
    readonly logger: DiagnosticsLogger,
    readonly tasks: TaskQueue
  ) {
    super((subscriber) => {
      const onMessage = (message: IPFSPubsubMessage) => subscriber.next(message)
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
export class IncomingChannel extends Observable<IPFSPubsubMessage> {
  constructor(
    readonly ipfs: IpfsApi,
    readonly topic: string,
    readonly resubscribeEvery: number,
    readonly pubsubLogger: ServiceLogger,
    readonly logger: DiagnosticsLogger,
    readonly tasks: TaskQueue = new TaskQueue()
  ) {
    super((subscriber) => {
      new PubsubIncoming(ipfs, topic, pubsubLogger, logger, this.tasks)
        .pipe(
          retryWhen((errors) =>
            errors.pipe(
              tap((e) => logger.err(e)),
              delay(resubscribeEvery)
            )
          )
        )
        .subscribe(subscriber)
    })
  }
}

/**
 * Pass only messages from other IPFS nodes.
 * @param ownPeerId$ - Own peer id.
 */
export function filterExternal(
  ownPeerId$: Observable<string>
): MonoTypeOperatorFunction<IPFSPubsubMessage> {
  return pipe(
    concatMap((data: IPFSPubsubMessage) => {
      return ownPeerId$.pipe(map((peerId) => ({ isOuter: data.from !== peerId, entry: data })))
    }),
    // Filter the container object synchronously for the value in each data container object
    filter((data) => data.isOuter),
    // remove the data container object from the observable chain
    map((data) => data.entry)
  )
}
