import { Observable } from 'rxjs'
import type { IpfsApi } from '@ceramicnetwork/common'
import { TaskQueue } from './task-queue'
import { DiagnosticsLogger, ServiceLogger } from '@ceramicnetwork/common'
import { pipe, MonoTypeOperatorFunction } from 'rxjs'
import { map, filter, concatMap, retryWhen, tap, delay } from 'rxjs/operators'

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

export function pubsubIncoming(ipfs: IpfsApi, topic: string, pubsubLogger: ServiceLogger) {
  return new Observable<IPFSPubsubMessage>((subscriber) => {
    const onMessage = (message: IPFSPubsubMessage) => subscriber.next(message)
    const onError = (error: Error) => subscriber.error(error)
    ipfs
      .id()
      .then(async (ipfsId) => {
        const peerId = ipfsId.id
        await ipfs.pubsub.subscribe(topic, onMessage, { onError })
        pubsubLogger.log({ peer: peerId, event: 'subscribed', topic: topic })
      })
      .catch(onError)

    return () => {
      ipfs.pubsub?.unsubscribe(topic, onMessage)?.catch(() => void {})
    }
  })
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
    readonly tasks: TaskQueue = new TaskQueue()
  ) {
    super((subscriber) => {
      const onMessage = (message: IPFSPubsubMessage) => subscriber.next(message)
      const onError = (error: Error) => subscriber.error(error)

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
          await ipfs.pubsub?.unsubscribe(topic, onMessage)
        })
      }
    })
    this.tasks = new TaskQueue()
  }
}

/**
 * Incoming IPFS PubSub message stream as Observable.
 */
export class IncomingChannel extends Observable<IPFSPubsubMessage> {
  constructor(
    readonly ipfs: IpfsApi,
    readonly topic: string,
    readonly resubscribeEvery: number,
    readonly pubsubLogger: ServiceLogger,
    readonly logger: DiagnosticsLogger
  ) {
    super((subscriber) => {
      new PubsubIncoming(ipfs, topic, pubsubLogger)
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
