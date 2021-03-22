import { DoctypeUtils, IpfsApi } from '@ceramicnetwork/common';
import { createIPFS } from '../../__tests__/ipfs-util';
import { createCeramic } from '../../__tests__/create-ceramic';
import { TileDoctype } from '@ceramicnetwork/doctype-tile';
import Ceramic from '../../ceramic';
import { delay } from '../../pubsub/__tests__/delay';

let ipfs: IpfsApi;
let ceramic: Ceramic;

beforeAll(async () => {
  ipfs = await createIPFS();
  ceramic = await createCeramic(ipfs, { docCacheLimit: 1, anchorOnRequest: false });
});

afterAll(async () => {
  await ceramic.close();
  await ipfs.stop();
});

const INITIAL = { stage: 'initial' };
const UPDATED = { stage: 'updated' };

test('cache eviction', async () => {
  await TileDoctype.create(ceramic, INITIAL);
  expect(ceramic.repository.inmemory.volatile.size).toEqual(1);
  await TileDoctype.create(ceramic, UPDATED);
  expect(ceramic.repository.inmemory.volatile.size).toEqual(1);
});

test('Doctype not subscribed, RunningState in cache', async () => {
  const document = await TileDoctype.create(ceramic, INITIAL);
  const state$ = await ceramic.repository.load(document.id);
  const updateRecord = await document._makeCommit(ceramic.context.did, UPDATED);
  await ceramic.repository.stateManager.applyCommit(state$, updateRecord);
  // Doctype does not see the change
  expect(document.state.content).toEqual(INITIAL);
  expect(document.state.next).toBeUndefined();
  // RunningState sees the change
  expect(state$.state.next.content).toEqual(UPDATED);
  expect(state$.state.content).toEqual(INITIAL);
});

test('Doctype not subscribed, RunningState evicted', async () => {
  const document = await TileDoctype.create(ceramic, INITIAL);
  const state$ = await ceramic.repository.load(document.id);
  await TileDoctype.create(ceramic, { 'evict': true });

  const state2$ = await ceramic.repository.load(document.id);
  const updateRecord = await new TileDoctype(state$, ceramic.context)._makeCommit(
      ceramic.context.did, UPDATED);
  await ceramic.repository.stateManager.applyCommit(state2$, updateRecord);

  // Doctype does not see the change
  expect(document.state.content).toEqual(INITIAL);
  expect(document.state.next).toBeUndefined();
  // RunningState does not see the change
  expect(state$.state.content).toEqual(INITIAL);
  expect(state$.state.next).toBeUndefined();
});

test('Doctype subscribed, RunningState in cache', async () => {
  const document = await TileDoctype.create(ceramic, INITIAL);
  document.subscribe();
  const state$ = await ceramic.repository.load(document.id);
  const updateRecord = await document._makeCommit(ceramic.context.did, UPDATED);
  await ceramic.repository.stateManager.applyCommit(state$, updateRecord);
  // Doctype sees the change
  expect(document.state.content).toEqual(INITIAL);
  expect(document.state.next.content).toEqual(UPDATED);
  // RunningState sees the change
  expect(state$.state.next.content).toEqual(UPDATED);
  expect(state$.state.content).toEqual(INITIAL);
});

test('Doctype subscribed, RunningState not evicted', async () => {
  const document = await TileDoctype.create(ceramic, INITIAL);
  document.subscribe();
  const state$ = await ceramic.repository.load(document.id);
  await TileDoctype.create(ceramic, { 'evict': true });

  const state2$ = await ceramic.repository.load(document.id);
  expect(state2$).toBe(state$);
  const updateRecord = await new TileDoctype(state$, ceramic.context)._makeCommit(
      ceramic.context.did, UPDATED);
  await ceramic.repository.stateManager.applyCommit(state2$, updateRecord);

  // Doctype sees change
  expect(document.state.content).toEqual(INITIAL);
  expect(document.state.next.content).toEqual(UPDATED);
  // RunningState does not see the change
  expect(state$.state.content).toEqual(INITIAL);
  expect(state$.state.next.content).toEqual(UPDATED);
});

test('RunningState stops updating after evicted', async () => {
  const createDocument = () => {
    return TileDoctype.create(ceramic, INITIAL, { deterministic: true });
  };
  const document1 = await createDocument();
  const runningState1 = await ceramic.repository.load(document1.id);
  await document1.update({stage: 'changed-1' });
  expect(runningState1.state.next.content).toEqual({ stage: 'changed-1' }); // Running state gets update

  expect(ceramic.repository.inmemory.volatile.size).toEqual(1);
  await TileDoctype.create(ceramic, { 'evict': true }); // Now doc1 is evicted
  expect(ceramic.repository.inmemory.volatile.size).toEqual(1);
  expect(runningState1.isStopped).toBeTruthy(); // RunningState is stopped after eviction

  const document2 = await createDocument();
  expect(document2.id).toEqual(document1.id); // Same ID

  await document2.update({ stage: 'changed-concurrently' });
  expect(document2.content).toEqual({ stage: 'changed-concurrently' });
  expect(runningState1.state.next.content).toEqual({ stage: 'changed-1' }); // Running state did not get update

  const runningState2 = await ceramic.repository.load(document2.id); // Running state for document2 AKA document1
  expect(runningState2.state.next.content).toEqual({ stage: 'changed-concurrently' }); // It is updated

  const document3 = await ceramic.loadDocument(document2.id);
  expect(document3.state).toEqual(document2.state);
});

test('StateLink receives updates', async () => {
  const createDocument = () => {
    return TileDoctype.create(ceramic, INITIAL, { deterministic: true });
  };
  const document1 = await createDocument();
  const runningState1 = await ceramic.repository.load(document1.id);
  await document1.update({ stage: 'changed-1' });
  expect(runningState1.state.next.content).toEqual({ stage: 'changed-1' }); // Running state gets update

  expect(ceramic.repository.inmemory.volatile.size).toEqual(1);
  await TileDoctype.create(ceramic, { 'evict': true }); // Now doc1 is evicted
  expect(ceramic.repository.inmemory.volatile.size).toEqual(1);
  expect(runningState1.isStopped).toBeTruthy(); // RunningState is stopped after eviction

  const document2 = await createDocument();
  expect(document2.id).toEqual(document1.id); // Same ID

  const changedConcurrently = { stage: 'changed-concurrently' };
  document1.subscribe();
  await document2.update(changedConcurrently);
  expect(document2.content).toEqual(changedConcurrently);
  expect(runningState1.state.next.content).toEqual({ stage: 'changed-1' }); // Running state 1 did not get update
  expect(document1.state).toEqual(document2.state); // But thanks to subscription, doctype still is aware of the update
});

test('free if no one subscribed', async () => {
  const durableStart = ceramic.repository.inmemory.durable.size;
  const volatileStart = ceramic.repository.inmemory.volatile.size;
  const doc1 = await TileDoctype.create(ceramic, INITIAL);
  expect(ceramic.repository.inmemory.volatile.size).toEqual(volatileStart + 1)
  expect(ceramic.repository.inmemory.durable.size).toEqual(durableStart)
  const subscription1 = doc1.subscribe()
  await delay(100); // Wait for plumbing
  expect(ceramic.repository.inmemory.volatile.size).toEqual(volatileStart)
  expect(ceramic.repository.inmemory.durable.size).toEqual(durableStart + 1)
  const doc2 = await ceramic.loadDocument(doc1.id)
  const subscription2 = doc2.subscribe()
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
    const doc1 = await TileDoctype.create(ceramic, INITIAL);
    // Evict
    await TileDoctype.create(ceramic, { 'evict': true });
    // No more doc1 in memory, and it is not pinned!
    expect(ceramic.repository.inmemory.get(doc1.id.toString())).toBeUndefined();
    doc1.subscribe();
    await delay(100); // Wait for plumbing
    const inmemory = ceramic.repository.inmemory.get(doc1.id.toString());
    // We set to memory the latest known state, i.e. from doctype.state
    expect(inmemory).toBeDefined();
    expect(DoctypeUtils.serializeState(inmemory.state)).toEqual(DoctypeUtils.serializeState(doc1.state));
  });

  test('pinned', async () => {
    const doc1 = await TileDoctype.create(ceramic, { foo: Math.random().toString() }, { deterministic: true });
    await ceramic.pin.add(doc1.id);

    const doc2 = await TileDoctype.create(ceramic, doc1.content, { deterministic: true });
    expect(DoctypeUtils.serializeState(doc1.state)).toEqual(DoctypeUtils.serializeState(doc2.state));

    // Divergence: doc2 < doc1
    await doc1.update({ blah: 333 });
    expect(DoctypeUtils.serializeState(doc1.state)).not.toEqual(DoctypeUtils.serializeState(doc2.state));

    doc2.subscribe();
    await delay(100); // Wait for plumbing
    const inmemory = ceramic.repository.inmemory.get(doc2.id.toString());
    // We set to memory the pinned state, instead of the one from doctype.state
    expect(inmemory).toBeDefined();
    expect(DoctypeUtils.serializeState(inmemory.state)).toEqual(DoctypeUtils.serializeState(doc1.state));
    expect(DoctypeUtils.serializeState(inmemory.state)).toEqual(DoctypeUtils.serializeState(doc2.state));
  });
});
