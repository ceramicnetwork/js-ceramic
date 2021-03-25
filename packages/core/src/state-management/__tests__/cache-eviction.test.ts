import { IpfsApi } from '@ceramicnetwork/common';
import { createIPFS } from '../../__tests__/ipfs-util';
import { createCeramic } from '../../__tests__/create-ceramic';
import { TileDoctype } from '@ceramicnetwork/doctype-tile';
import Ceramic from '../../ceramic';

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
  await ceramic.createDocument('tile', { content: INITIAL });
  expect(ceramic.repository.inmemory.size).toEqual(1);
  await ceramic.createDocument('tile', { content: UPDATED });
  expect(ceramic.repository.inmemory.size).toEqual(1);
});

test('Doctype not subscribed, RunningState in cache', async () => {
  const document = await ceramic.createDocument<TileDoctype>('tile', { content: INITIAL });
  const state$ = await ceramic.repository.load(document.id);
  const updateRecord = await TileDoctype._makeCommit(document, ceramic.context.did, UPDATED);
  await ceramic.repository.stateManager.applyCommit(state$, updateRecord);
  // Doctype does not see the change
  expect(document.state.content).toEqual(INITIAL);
  expect(document.state.next).toBeUndefined();
  // RunningState sees the change
  expect(state$.state.next.content).toEqual(UPDATED);
  expect(state$.state.content).toEqual(INITIAL);
});

test('Doctype not subscribed, RunningState evicted', async () => {
  const document = await ceramic.createDocument<TileDoctype>('tile', { content: INITIAL });
  const state$ = await ceramic.repository.load(document.id);
  await ceramic.createDocument('tile', { content: 'evict' });

  const state2$ = await ceramic.repository.load(document.id);
  const updateRecord = await TileDoctype._makeCommit(
    new TileDoctype(state$, ceramic.context),
    ceramic.context.did,
    UPDATED,
  );
  await ceramic.repository.stateManager.applyCommit(state2$, updateRecord);

  // Doctype does not see the change
  expect(document.state.content).toEqual(INITIAL);
  expect(document.state.next).toBeUndefined();
  // RunningState does not see the change
  expect(state$.state.content).toEqual(INITIAL);
  expect(state$.state.next).toBeUndefined();
});

test('Doctype subscribed, RunningState in cache', async () => {
  const document = await ceramic.createDocument<TileDoctype>('tile', { content: INITIAL });
  document.subscribe();
  const state$ = await ceramic.repository.load(document.id);
  const updateRecord = await TileDoctype._makeCommit(document, ceramic.context.did, UPDATED);
  await ceramic.repository.stateManager.applyCommit(state$, updateRecord);
  // Doctype sees the change
  expect(document.state.content).toEqual(INITIAL);
  expect(document.state.next.content).toEqual(UPDATED);
  // RunningState sees the change
  expect(state$.state.next.content).toEqual(UPDATED);
  expect(state$.state.content).toEqual(INITIAL);
});

test('Doctype subscribed, RunningState evicted', async () => {
  const document = await ceramic.createDocument<TileDoctype>('tile', { content: INITIAL });
  document.subscribe();
  const state$ = await ceramic.repository.load(document.id);
  await ceramic.createDocument('tile', { content: 'evict' });

  const state2$ = await ceramic.repository.load(document.id);
  const updateRecord = await TileDoctype._makeCommit(
    new TileDoctype(state$, ceramic.context),
    ceramic.context.did,
    UPDATED,
  );
  await ceramic.repository.stateManager.applyCommit(state2$, updateRecord);

  // Doctype sees change
  expect(document.state.content).toEqual(INITIAL);
  expect(document.state.next.content).toEqual(UPDATED);
  // RunningState does not see the change
  expect(state$.state.content).toEqual(INITIAL);
  expect(state$.state.next).toBeUndefined();
});

test('RunningState stops updating after evicted', async () => {
  const createDocument = () => {
    return ceramic.createDocument<TileDoctype>('tile', { content: { stage: 'initial' }, deterministic: true });
  };
  const document1 = await createDocument();
  const runningState1 = await ceramic.repository.load(document1.id);
  await document1.change({
    content: { stage: 'changed-1' },
  });
  expect(runningState1.state.next.content).toEqual({ stage: 'changed-1' }); // Running state gets update

  expect(ceramic.repository.inmemory.size).toEqual(1);
  await ceramic.createDocument('tile', { content: { purpose: 'evict-one' } }); // Now doc1 is evicted
  expect(ceramic.repository.inmemory.size).toEqual(1);
  expect(runningState1.isStopped).toBeTruthy(); // RunningState is stopped after eviction

  const document2 = await createDocument();
  expect(document2.id).toEqual(document1.id); // Same ID

  await document2.change({ content: { stage: 'changed-concurrently' } });
  expect(document2.content).toEqual({ stage: 'changed-concurrently' });
  expect(runningState1.state.next.content).toEqual({ stage: 'changed-1' }); // Running state did not get update

  const runningState2 = await ceramic.repository.load(document2.id); // Running state for document2 AKA document1
  expect(runningState2.state.next.content).toEqual({ stage: 'changed-concurrently' }); // It is updated

  const document3 = await ceramic.loadDocument(document2.id);
  expect(document3.state).toEqual(document2.state);
});

test('StateLink receives updates', async () => {
  const createDocument = () => {
    return ceramic.createDocument<TileDoctype>('tile', { content: { stage: 'initial' }, deterministic: true });
  };
  const document1 = await createDocument();
  const runningState1 = await ceramic.repository.load(document1.id);
  await document1.change({
    content: { stage: 'changed-1' },
  });
  expect(runningState1.state.next.content).toEqual({ stage: 'changed-1' }); // Running state gets update

  expect(ceramic.repository.inmemory.size).toEqual(1);
  await ceramic.createDocument('tile', { content: { purpose: 'evict-one' } }); // Now doc1 is evicted
  expect(ceramic.repository.inmemory.size).toEqual(1);
  expect(runningState1.isStopped).toBeTruthy(); // RunningState is stopped after eviction

  const document2 = await createDocument();
  expect(document2.id).toEqual(document1.id); // Same ID

  const changedConcurrently = { stage: 'changed-concurrently' };
  document1.subscribe();
  await document2.change({ content: changedConcurrently });
  expect(document2.content).toEqual(changedConcurrently);
  expect(runningState1.state.next.content).toEqual({ stage: 'changed-1' }); // Running state 1 did not get update
  expect(document1.state).toEqual(document2.state); // But thanks to subscription, doctype still is aware of the update
});
