import { MsgType } from '../pubsub-message';
import { asIpfsMessage } from './as-ipfs-message';
import { DocID } from '@ceramicnetwork/docid';
import { from } from 'rxjs';
import { MessageBus } from '../message-bus';
import { Pubsub } from '../pubsub';
import { bufferCount, first, delay } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import * as random from '@stablelib/random';

const FAKE_DOC_ID = DocID.fromString('kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s');
const OUTER_PEER_ID = 'OUTER_PEER_ID';

const LENGTH = 2;
const MESSAGES = Array.from({ length: LENGTH }).map((_, index) => {
  return {
    typ: MsgType.QUERY as MsgType.QUERY,
    id: index.toString(),
    doc: FAKE_DOC_ID,
  };
});
const OUTER_MESSAGES = MESSAGES.map((message) => asIpfsMessage(message, OUTER_PEER_ID));

test('subscribe to pubsub', async () => {
  const pubsub = (from(OUTER_MESSAGES).pipe(delay(100)) as unknown) as Pubsub;
  const subscribeSpy = jest.spyOn(pubsub, 'subscribe');
  const messageBus = new MessageBus(pubsub);
  expect(subscribeSpy).toBeCalledTimes(1);
  const received = await messageBus.pipe(bufferCount(LENGTH), first()).toPromise();
  expect(received).toEqual(OUTER_MESSAGES);
});

test('publish to pubsub', async () => {
  const pubsub = ({
    subscribe: jest.fn(() => Subscription.EMPTY),
    next: jest.fn(),
  } as unknown) as Pubsub;
  const messageBus = new MessageBus(pubsub);
  const message = {
    typ: MsgType.QUERY as MsgType.QUERY,
    id: random.randomString(32),
    doc: FAKE_DOC_ID,
  };
  messageBus.next(message);
  expect(pubsub.next).toBeCalledTimes(1);
  expect(pubsub.next).toBeCalledWith(message);
});
test('not publish to pubsub if closed', () => {
  const pubsub = ({
    subscribe: jest.fn(() => Subscription.EMPTY),
    next: jest.fn(),
  } as unknown) as Pubsub;
  const messageBus = new MessageBus(pubsub);
  const message = {
    typ: MsgType.QUERY as MsgType.QUERY,
    id: random.randomString(32),
    doc: FAKE_DOC_ID,
  };
  messageBus.unsubscribe();
  messageBus.next(message);
  expect(pubsub.next).toBeCalledTimes(0);
});

test('unsubscribe', async () => {
  const pubsub = (from(OUTER_MESSAGES).pipe() as unknown) as Pubsub;
  const messageBus = new MessageBus(pubsub);
  const subscription1 = messageBus.subscribe();
  const subscription2 = messageBus.subscribe();
  messageBus.unsubscribe();
  expect(subscription1.closed).toBeTruthy();
  expect(subscription2.closed).toBeTruthy();
  expect(messageBus.closed).toBeTruthy();
});
