import { StreamUtils, IpfsApi } from '@ceramicnetwork/common';
import { createIPFS } from '../../__tests__/ipfs-util';
import { createCeramic } from '../../__tests__/create-ceramic';
import { TileDocument } from '@ceramicnetwork/stream-tile';
import Ceramic from '../../ceramic';
import { delay } from '../../pubsub/__tests__/delay';

let ipfs: IpfsApi;
let ceramic: Ceramic;
let metadata: any;

beforeAll(async () => {
  ipfs = await createIPFS();
  ceramic = await createCeramic(ipfs, { streamCacheLimit: 1, anchorOnRequest: false });
  metadata = { deterministic: true, controllers: [ceramic.did.id], family: "family", tags: ["x", "y"] }
});

afterAll(async () => {
  await ceramic.close();
  await ipfs.stop();
});

const INITIAL = { stage: 'initial' };
const UPDATED = { stage: 'updated' };

test('cache eviction', async () => {
  await TileDocument.create(ceramic, INITIAL);
  expect(ceramic.repository.inmemory.volatile.size).toEqual(1);
  await TileDocument.create(ceramic, UPDATED);
  expect(ceramic.repository.inmemory.volatile.size).toEqual(1);
});

test('Stream not subscribed, RunningState in cache', async () => {
  const stream = await TileDocument.create(ceramic, INITIAL);
  const state$ = await ceramic.repository.load(stream.id, {});
  const updateRecord = await stream.makeCommit(ceramic, UPDATED);
  await ceramic.repository.stateManager.applyCommit(state$.id, updateRecord, { anchor: false, publish: false });
  // Stream does not see the change
  expect(stream.state.content).toEqual(INITIAL);
  expect(stream.state.next).toBeUndefined();
  // RunningState sees the change
  expect(state$.state.next.content).toEqual(UPDATED);
  expect(state$.state.content).toEqual(INITIAL);
});

test('Stream not subscribed, RunningState evicted', async () => {
  const stream = await TileDocument.create(ceramic, INITIAL);
  const state$ = await ceramic.repository.load(stream.id, {});
  await TileDocument.create(ceramic, { 'evict': true });

  const state2$ = await ceramic.repository.load(stream.id, {});
  const updateRecord = await new TileDocument(state$, ceramic.context).makeCommit(ceramic, UPDATED);
  await ceramic.repository.stateManager.applyCommit(state2$.id, updateRecord, { anchor: false, publish: false });

  // Stream does not see the change
  expect(stream.state.content).toEqual(INITIAL);
  expect(stream.state.next).toBeUndefined();
  // RunningState does not see the change
  expect(state$.state.content).toEqual(INITIAL);
  expect(state$.state.next).toBeUndefined();
});

test('Stream subscribed, RunningState in cache', async () => {
  const stream = await TileDocument.create(ceramic, INITIAL);
  stream.subscribe();
  const state$ = await ceramic.repository.load(stream.id, {});
  const updateRecord = await stream.makeCommit(ceramic, UPDATED);
  await ceramic.repository.stateManager.applyCommit(state$.id, updateRecord, { anchor: false, publish: false });
  // Stream sees the change
  expect(stream.state.content).toEqual(INITIAL);
  expect(stream.state.next.content).toEqual(UPDATED);
  // RunningState sees the change
  expect(state$.state.next.content).toEqual(UPDATED);
  expect(state$.state.content).toEqual(INITIAL);
});

test('Stream subscribed, RunningState not evicted', async () => {
  const stream = await TileDocument.create(ceramic, INITIAL);
  stream.subscribe();
  const state$ = await ceramic.repository.load(stream.id, {});
  await TileDocument.create(ceramic, { 'evict': true });

  const state2$ = await ceramic.repository.load(stream.id, {});
  expect(state2$).toBe(state$);
  const updateRecord = await new TileDocument(state$, ceramic.context).makeCommit(ceramic, UPDATED);
  await ceramic.repository.stateManager.applyCommit(state2$.id, updateRecord, { anchor: false, publish: false });

  // Stream sees change
  expect(stream.state.content).toEqual(INITIAL);
  expect(stream.state.next.content).toEqual(UPDATED);
  // RunningState does not see the change
  expect(state$.state.content).toEqual(INITIAL);
  expect(state$.state.next.content).toEqual(UPDATED);
});

test('RunningState stops updating after evicted', async () => {
  const createDocument = () => {
    return TileDocument.create(ceramic, null, metadata, { syncTimeoutSeconds: 0 });
  };
  const stream1 = await createDocument();
  await stream1.update(INITIAL);
  const runningState1 = await ceramic.repository.load(stream1.id, {});
  await stream1.update({stage: 'changed-1' });
  expect(runningState1.state.next.content).toEqual({ stage: 'changed-1' }); // Running state gets update

  expect(ceramic.repository.inmemory.volatile.size).toEqual(1);
  await TileDocument.create(ceramic, { 'evict': true }); // Now stream1 is evicted
  expect(ceramic.repository.inmemory.volatile.size).toEqual(1);
  expect(runningState1.isStopped).toBeTruthy(); // RunningState is stopped after eviction

  const stream2 = await createDocument();
  await stream2.update(INITIAL);
  expect(stream2.id).toEqual(stream1.id); // Same ID

  await stream2.update({ stage: 'changed-concurrently' });
  expect(stream2.content).toEqual({ stage: 'changed-concurrently' });
  expect(runningState1.state.next.content).toEqual({ stage: 'changed-1' }); // Running state did not get update

  const runningState2 = await ceramic.repository.load(stream2.id, {}); // Running state for stream2 AKA stream1
  expect(runningState2.state.next.content).toEqual({ stage: 'changed-concurrently' }); // It is updated

  const stream3 = await ceramic.loadStream(stream2.id);
  expect(stream3.state).toEqual(stream2.state);
});

test('StateLink receives updates', async () => {
  const createDocument = () => {
    return TileDocument.create(ceramic, null, metadata, { syncTimeoutSeconds: 0 });
  };
  const stream1 = await createDocument();
  await stream1.update(INITIAL);
  const runningState1 = await ceramic.repository.load(stream1.id, {});
  await stream1.update({ stage: 'changed-1' });
  expect(runningState1.state.next.content).toEqual({ stage: 'changed-1' }); // Running state gets update

  expect(ceramic.repository.inmemory.volatile.size).toEqual(1);
  await TileDocument.create(ceramic, { 'evict': true }); // Now stream1 is evicted
  expect(ceramic.repository.inmemory.volatile.size).toEqual(1);
  expect(runningState1.isStopped).toBeTruthy(); // RunningState is stopped after eviction

  const stream2 = await createDocument();
  await stream2.update(INITIAL);
  expect(stream2.id).toEqual(stream1.id); // Same ID

  const changedConcurrently = { stage: 'changed-concurrently' };
  stream1.subscribe();
  await stream2.update(changedConcurrently);
  expect(stream2.content).toEqual(changedConcurrently);
  expect(runningState1.state.next.content).toEqual({ stage: 'changed-1' }); // Running state 1 did not get update
  expect(stream1.state).toEqual(stream2.state); // But thanks to subscription, streamtype still is aware of the update
});

test('free if no one subscribed', async () => {
  const durableStart = ceramic.repository.inmemory.durable.size;
  const volatileStart = ceramic.repository.inmemory.volatile.size;
  const stream1 = await TileDocument.create(ceramic, INITIAL);
  expect(ceramic.repository.inmemory.volatile.size).toEqual(volatileStart + 1)
  expect(ceramic.repository.inmemory.durable.size).toEqual(durableStart)
  const subscription1 = stream1.subscribe()
  await delay(100); // Wait for plumbing
  expect(ceramic.repository.inmemory.volatile.size).toEqual(volatileStart)
  expect(ceramic.repository.inmemory.durable.size).toEqual(durableStart + 1)
  const stream2 = await ceramic.loadStream(stream1.id)
  const subscription2 = stream2.subscribe()
  await delay(100); // Wait for plumbing
  expect(ceramic.repository.inmemory.volatile.size).toEqual(volatileStart)
  expect(ceramic.repository.inmemory.durable.size).toEqual(durableStart + 1)
  subscription1.unsubscribe()
  await delay(100); // Wait for plumbing
  expect(ceramic.repository.inmemory.volatile.size).toEqual(volatileStart)
  expect(ceramic.repository.inmemory.durable.size).toEqual(durableStart + 1)
  subscription2.unsubscribe()
  await delay(100); // Wait for plumbing
  expect(ceramic.repository.inmemory.volatile.size).toEqual(volatileStart + 1)
  expect(ceramic.repository.inmemory.durable.size).toEqual(durableStart)
});

describe('evicted then subscribed', () => {
  test('not pinned', async () => {
    const stream1 = await TileDocument.create(ceramic, INITIAL);
    // Evict
    await TileDocument.create(ceramic, { 'evict': true });
    // No more stream1 in memory, and it is not pinned!
    expect(ceramic.repository.inmemory.get(stream1.id.toString())).toBeUndefined();
    stream1.subscribe();
    await delay(100); // Wait for plumbing
    const inmemory = ceramic.repository.inmemory.get(stream1.id.toString());
    // We set to memory the latest known state, i.e. from streamtype.state
    expect(inmemory).toBeDefined();
    expect(StreamUtils.serializeState(inmemory.state)).toEqual(StreamUtils.serializeState(stream1.state));
  });

  test('pinned', async () => {
    const stream1 = await TileDocument.create(ceramic, null, metadata, { syncTimeoutSeconds: 0 });
    await ceramic.pin.add(stream1.id);

    const stream2 = await TileDocument.create(ceramic, null, metadata, { syncTimeoutSeconds: 0 });
    expect(StreamUtils.serializeState(stream1.state)).toEqual(StreamUtils.serializeState(stream2.state));

    // Divergence: stream2 < stream1
    await stream1.update({ blah: 333 });
    expect(StreamUtils.serializeState(stream1.state)).not.toEqual(StreamUtils.serializeState(stream2.state));

    stream2.subscribe();
    await delay(100); // Wait for plumbing
    const inmemory = ceramic.repository.inmemory.get(stream2.id.toString());
    // We set to memory the pinned state, instead of the one from streamtype.state
    expect(inmemory).toBeDefined();
    expect(StreamUtils.serializeState(inmemory.state)).toEqual(StreamUtils.serializeState(stream1.state));
    expect(StreamUtils.serializeState(inmemory.state)).toEqual(StreamUtils.serializeState(stream2.state));
  });
});
