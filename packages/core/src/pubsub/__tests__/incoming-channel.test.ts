import { IpfsApi, LoggerProvider } from '@ceramicnetwork/common';
import { createIPFS } from '../../__tests__/ipfs-util';
import { IncomingChannel, filterExternal } from '../incoming-channel';
import { delay } from './delay';
import { asIpfsMessage } from './as-ipfs-message';
import { MsgType } from '../pubsub-message';
import { StreamID } from '@ceramicnetwork/streamid';
import { from } from 'rxjs';

const FAKE_STREAM_ID = StreamID.fromString('kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s');

const TOPIC = '/test';
const loggerProvider = new LoggerProvider();
const pubsubLogger = loggerProvider.makeServiceLogger('pubsub');
const diagnosticsLogger = loggerProvider.getDiagnosticsLogger();
const PEER_ID = 'PEER_ID';

describe('connection', () => {
  let ipfs: IpfsApi;

  beforeEach(async () => {
    ipfs = await createIPFS();
  });

  afterEach(async () => {
    await ipfs.stop();
  });

  test('subscribe and unsubscribe', async () => {
    const incoming$ = new IncomingChannel(ipfs, TOPIC, 30000, pubsubLogger, diagnosticsLogger);
    const subscribeSpy = jest.spyOn(ipfs.pubsub, 'subscribe');
    const unsubscribeSpy = jest.spyOn(ipfs.pubsub, 'unsubscribe');
    const subscription = incoming$.subscribe();
    await incoming$.tasks.onIdle();
    expect(await ipfs.pubsub.ls()).toEqual([TOPIC]);
    subscription.unsubscribe();
    await incoming$.tasks.onIdle();
    expect(await ipfs.pubsub.ls()).toEqual([]);
    expect(subscribeSpy).toBeCalledTimes(1);
    expect(unsubscribeSpy).toBeCalledTimes(2); // 1 on initial subscription attempt, +1 on final unsubscribe
  });

  test('resubscribe', async () => {
    const resubscribePeriod = 200;
    const incoming$ = new IncomingChannel(ipfs, TOPIC, resubscribePeriod, pubsubLogger, diagnosticsLogger);
    const subscribeSpy = jest.spyOn(ipfs.pubsub, 'subscribe');
    const unsubscribeSpy = jest.spyOn(ipfs.pubsub, 'unsubscribe');
    const subscription = incoming$.subscribe();
    await incoming$.tasks.onIdle();
    expect(subscribeSpy).toBeCalledTimes(1); // Initial pubsub.subscribe
    expect(unsubscribeSpy).toBeCalledTimes(1); // Resubscribe attempt: _unsubscribe_ then subscribe
    await ipfs.pubsub.unsubscribe(TOPIC);
    await delay(resubscribePeriod * 3);
    expect(unsubscribeSpy).toBeCalledTimes(3); // +1 on resubscribe, +1 on force-unsubscribe few lines above
    expect(subscribeSpy).toBeCalledTimes(2); // +1 on resubscribe
    expect(await ipfs.pubsub.ls()).toEqual([TOPIC]); // And now we subscribed
    subscription.unsubscribe();
  });
});

test('pass incoming message', async () => {
  const length = 10;
  const messages = Array.from({ length }).map((_, index) => {
    return asIpfsMessage({
      typ: MsgType.QUERY,
      id: index.toString(),
      doc: FAKE_STREAM_ID,
    });
  });
  const feed$ = from(messages);
  const ipfs = {
    pubsub: {
      subscribe: async (_, handler) => {
        feed$.subscribe(handler);
      },
      unsubscribe: jest.fn(),
      ls: jest.fn(() => []),
    },
    id: async () => ({ id: PEER_ID }),
  };
  const incoming$ = new IncomingChannel(ipfs, TOPIC, 30000, pubsubLogger, diagnosticsLogger);
  const result: any[] = [];
  const subscription = incoming$.subscribe((message) => {
    result.push(message);
  });
  await incoming$.tasks.onIdle(); // Wait till fully subscribed
  expect(result).toEqual(messages);
  subscription.unsubscribe();
});

describe('filterOuter', () => {
  const OUTER_PEER_ID = 'OUTER_PEER_ID';

  test('pass only outer messages', async () => {
    const length = 2;
    const outerMessages = Array.from({ length }).map((_, index) => {
      return asIpfsMessage(
        {
          typ: MsgType.QUERY,
          id: index.toString(),
          doc: FAKE_STREAM_ID,
        },
        OUTER_PEER_ID,
      );
    });
    const innerMessages = Array.from({ length }).map((_, index) => {
      return asIpfsMessage(
        {
          typ: MsgType.QUERY,
          id: index.toString(),
          doc: FAKE_STREAM_ID,
        },
        PEER_ID,
      );
    });
    const messages = innerMessages.concat(outerMessages);
    const feed$ = from(messages);
    const ipfs = {
      pubsub: {
        subscribe: async (_, handler) => {
          feed$.subscribe(handler);
        },
        unsubscribe: jest.fn(),
        ls: jest.fn(() => []),
      },
      id: async () => ({ id: PEER_ID }),
    };
    const incoming$ = new IncomingChannel(ipfs, TOPIC, 30000, pubsubLogger, diagnosticsLogger);
    const result: any[] = [];
    const peerId$ = from(ipfs.id().then((_) => _.id));
    const subscription = incoming$.pipe(filterExternal(peerId$)).subscribe((message) => {
      result.push(message);
    });
    await incoming$.tasks.onIdle(); // Wait till fully subscribed
    expect(result).toEqual(outerMessages);
    subscription.unsubscribe();
  });
});
