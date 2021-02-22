import { IpfsApi, LoggerProvider } from '@ceramicnetwork/common';
import { createIPFS } from '../../__tests__/ipfs-util';
import { PubsubIncoming } from '../pubsub-incoming';
import { TaskQueue } from '../task-queue';

let ipfs: IpfsApi;

beforeEach(async () => {
  ipfs = await createIPFS();
});

afterEach(async () => {
  await ipfs.stop();
});

const TOPIC = '/test';
const loggerProvider = new LoggerProvider()
const pubsubLogger = loggerProvider.makeServiceLogger("pubsub")
const diagnosticsLogger = loggerProvider.getDiagnosticsLogger()
const PEER_ID = 'FAKE_PEER_ID'

async function delay(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(() => resolve(), ms));
}

test('subscribe and unsubscribe', async () => {
  const taskQueue = new TaskQueue();
  const incoming = new PubsubIncoming(ipfs, TOPIC, 30000, PEER_ID, pubsubLogger, diagnosticsLogger, taskQueue);
  const subscribeSpy = jest.spyOn(ipfs.pubsub, 'subscribe');
  const unsubscribeSpy = jest.spyOn(ipfs.pubsub, 'unsubscribe');
  const subscription = incoming.subscribe();
  await taskQueue.onIdle();
  expect(await ipfs.pubsub.ls()).toEqual([TOPIC]);
  subscription.unsubscribe();
  await taskQueue.onIdle();
  expect(await ipfs.pubsub.ls()).toEqual([]);
  expect(subscribeSpy).toBeCalledTimes(1);
  expect(unsubscribeSpy).toBeCalledTimes(2); // 1 on initial subscription attempt, +1 on final unsubscribe
});

test('resubscribe', async () => {
  const taskQueue = new TaskQueue();
  const resubscribePeriod = 200;
  const incoming = new PubsubIncoming(ipfs, TOPIC, resubscribePeriod, PEER_ID, pubsubLogger, diagnosticsLogger, taskQueue);
  const subscribeSpy = jest.spyOn(ipfs.pubsub, 'subscribe');
  const unsubscribeSpy = jest.spyOn(ipfs.pubsub, 'unsubscribe');
  const subscription = incoming.subscribe();
  await taskQueue.onIdle();
  expect(subscribeSpy).toBeCalledTimes(1); // Initial pubsub.subscribe
  expect(unsubscribeSpy).toBeCalledTimes(1); // Resubscribe attempt: _unsubscribe_ then subscribe
  await ipfs.pubsub.unsubscribe(TOPIC);
  await delay(resubscribePeriod * 3);
  expect(unsubscribeSpy).toBeCalledTimes(3); // +1 on resubscribe, +1 on force-unsubscribe few lines above
  expect(subscribeSpy).toBeCalledTimes(2); // +1 on resubscribe
  expect(await ipfs.pubsub.ls()).toEqual([TOPIC]); // And now we subscribed
  subscription.unsubscribe();
});
