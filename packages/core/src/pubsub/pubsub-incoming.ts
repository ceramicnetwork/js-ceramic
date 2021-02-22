import { from, Observable } from 'rxjs';
import { IPFSPubsubMessage } from './resubscribe';
import { IpfsApi } from '@ceramicnetwork/common';
import { filter, switchMap, tap } from 'rxjs/operators';

/**
 * IPFS pubsub message bus.
 */
export class PubsubIncoming extends Observable<IPFSPubsubMessage> {
  constructor(readonly ipfs: IpfsApi, incoming$Factory: (peerId: string) => Observable<IPFSPubsubMessage>) {
    super((subscriber) => {
      // Get peer id, lazy.
      const peerId$ = from<Promise<string>>(ipfs.id().then((_) => _.id));

      // Outer messages only
      const isOuter = (peerId: string) => (message: IPFSPubsubMessage) => {
        console.log('psi.isouter', message)
        return message.from !== peerId;
      };

      // Sent by others
      const outer$ = (peerId: string) => {
        // Incoming message feed
        const incoming$ = incoming$Factory(peerId);
        return incoming$.pipe(filter(isOuter(peerId)));
      };

      peerId$.pipe(switchMap(outer$), tap(v => {console.log('psi.0', v)})).subscribe(subscriber);
    });
  }
}
