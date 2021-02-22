import { IpfsApi } from '@ceramicnetwork/common';
import { Subject } from 'rxjs';
import { IPFSPubsubMessage } from '../resubscribe';
import { PubsubIncoming } from '../pubsub-incoming';
import { asIpfsMessage } from './as-ipfs-message';
import { MsgType } from '../pubsub-message';
import { DocID } from '@ceramicnetwork/docid';

const PEER_ID = 'PEER_ID';
const FAKE_DOC_ID = DocID.fromString('kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s');

const ipfs = ({
  id: jest.fn(async () => ({ id: PEER_ID })),
} as unknown) as IpfsApi;

const outerMessages = Array.from({ length: 2 }).map((_, i) => {
  return asIpfsMessage({
    typ: MsgType.QUERY,
    id: i.toString(),
    doc: FAKE_DOC_ID,
  });
});

const mineMessages = Array.from({ length: 2 }).map((_, i) => {
  return asIpfsMessage(
    {
      typ: MsgType.QUERY,
      id: i.toString(),
      doc: FAKE_DOC_ID,
    },
    PEER_ID,
  );
});

test('get incoming message, except mine', async () => {
  const incoming$ = new Subject<IPFSPubsubMessage>();
  const isReady$ = new Subject();
  const incoming$Factory = () => {
    isReady$.complete();
    return incoming$;
  };
  const pubsub = new PubsubIncoming(ipfs, incoming$Factory);
  const result: IPFSPubsubMessage[] = [];
  pubsub.subscribe((message) => result.push(message));
  await isReady$.toPromise(); // Wait till the plumbing is set up
  mineMessages.forEach((message) => incoming$.next(message));
  outerMessages.forEach((message) => incoming$.next(message));
  expect(result).toEqual(outerMessages); // No mine messages, only outer
});
