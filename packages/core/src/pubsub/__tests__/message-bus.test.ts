import { buildQueryMessage, MsgType, ResponseMessage } from '../pubsub-message';
import { asIpfsMessage } from './as-ipfs-message';
import { StreamID } from '@ceramicnetwork/streamid';
import { from, Subscription, Observable } from 'rxjs';
import { MAX_RESPONSE_INTERVAL, MessageBus } from '../message-bus';
import { Pubsub } from '../pubsub';
import { bufferCount, concatMap, delay, first } from 'rxjs/operators';
import * as random from '@stablelib/random';
import CID from 'cids';

const FAKE_STREAM_ID = StreamID.fromString('kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s');
const OUTER_PEER_ID = 'OUTER_PEER_ID';

const LENGTH = 2;
const MESSAGES = Array.from({ length: LENGTH }).map((_, index) => {
  return {
    typ: MsgType.QUERY as MsgType.QUERY,
    id: index.toString(),
    stream: FAKE_STREAM_ID,
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
    stream: FAKE_STREAM_ID,
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
    stream: FAKE_STREAM_ID,
  };
  messageBus.unsubscribe();
  messageBus.next(message);
  await new Promise((resolve) => setTimeout(resolve, 100));
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
  const FAKE_CID1 = new CID('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu');
  const FAKE_CID2 = new CID('bafybeig6xv5nwphfmvcnektpnojts44jqcuam7bmye2pb54adnrtccjlsu');
  const queryMessage = buildQueryMessage(FAKE_STREAM_ID);
  const responseMessage1: ResponseMessage = {
    typ: MsgType.RESPONSE,
    id: queryMessage.id,
    tips: new Map().set(FAKE_STREAM_ID.toString(), FAKE_CID1),
  };
  const responseMessage2: ResponseMessage = {
    typ: MsgType.RESPONSE,
    id: queryMessage.id,
    tips: new Map().set(FAKE_STREAM_ID.toString(), FAKE_CID2),
  };
  const pubsub = (from([responseMessage1, responseMessage2]).pipe(delay(200)) as unknown) as Pubsub;
  pubsub.next = jest.fn();

  test('return tips', async () => {
    const messageBus = new MessageBus(pubsub);
    const responses = [];
    const subscription = messageBus.queryNetwork(FAKE_STREAM_ID).subscribe((r) => {
      responses.push(r);
    });
    await new Promise<void>((resolve) => subscription.add(resolve));
    expect(pubsub.next).toBeCalledWith(queryMessage);
    expect(responses).toEqual([FAKE_CID1, FAKE_CID2]);
  });

  test('delayed message', async () => {
    const pubsub = (from([responseMessage1, responseMessage2]).pipe(
      concatMap(async (r) => {
        await new Promise((resolve) => setTimeout(resolve, MAX_RESPONSE_INTERVAL * 2));
        return r;
      }),
    ) as unknown) as Pubsub;
    pubsub.next = jest.fn();
    const messageBus = new MessageBus(pubsub);
    const responses = [];
    const subscription = messageBus.queryNetwork(FAKE_STREAM_ID).subscribe((r) => {
      responses.push(r);
    });
    await new Promise<void>((resolve) => subscription.add(resolve));
    expect(pubsub.next).toBeCalledWith(queryMessage);
    expect(responses).toEqual([FAKE_CID1]);
  });

  test('late first message', async () => {
    const pubsub = (new Observable<ResponseMessage>((subscriber) => {
      setTimeout(() => {
        subscriber.next(responseMessage1);
        setTimeout(() => {
          subscriber.next(responseMessage2);
          subscriber.complete();
        }, MAX_RESPONSE_INTERVAL * 2);
      }, MAX_RESPONSE_INTERVAL * 3);
    }) as unknown) as Pubsub;
    (pubsub as any).next = jest.fn();
    const messageBus = new MessageBus(pubsub);
    const responses = [];
    const subscription = messageBus.queryNetwork(FAKE_STREAM_ID).subscribe((r) => {
      responses.push(r);
    });
    await new Promise<void>((resolve) => subscription.add(resolve));
    expect(pubsub.next).toBeCalledWith(queryMessage);
    expect(responses).toEqual([FAKE_CID1]);
  });
});
