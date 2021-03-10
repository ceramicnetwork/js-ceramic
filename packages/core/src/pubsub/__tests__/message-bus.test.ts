import { buildQueryMessage, MsgType, ResponseMessage } from '../pubsub-message';
import { asIpfsMessage } from './as-ipfs-message';
import { DocID } from '@ceramicnetwork/docid';
import { from, Subscription, of } from 'rxjs';
import { MessageBus } from '../message-bus';
import { Pubsub } from '../pubsub';
import { bufferCount, delay, first, timeoutWith } from 'rxjs/operators';
import * as random from '@stablelib/random';
import CID from 'cids';

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
test('not publish to pubsub if closed', async () => {
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
  await new Promise(resolve => setTimeout(resolve, 100))
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

describe('queryNetwork', () => {
  const FAKE_CID = new CID('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu');
  const queryMessage = buildQueryMessage(FAKE_DOC_ID);
  const responseMessage: ResponseMessage = {
    typ: MsgType.RESPONSE,
    id: queryMessage.id,
    tips: new Map().set(FAKE_DOC_ID.toString(), FAKE_CID),
  };
  const pubsub = (from([responseMessage]).pipe(delay(300)) as unknown) as Pubsub;
  pubsub.next = jest.fn();

  test('return tip', async () => {
    const messageBus = new MessageBus(pubsub);
    const response = await messageBus.queryNetwork(FAKE_DOC_ID).toPromise();
    expect(pubsub.next).toBeCalledWith(queryMessage);
    expect(response).toEqual(FAKE_CID);
  });

  test('timeout: return undefined', async () => {
    const messageBus = new MessageBus(pubsub);
    const response = await messageBus
      .queryNetwork(FAKE_DOC_ID)
      .pipe(timeoutWith(200, of(undefined)))
      .toPromise();
    expect(pubsub.next).toBeCalledWith(queryMessage);
    expect(response).toEqual(undefined);
  });
});
