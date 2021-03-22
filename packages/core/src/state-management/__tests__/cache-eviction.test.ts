import { IpfsApi } from '@ceramicnetwork/common';
import { createIPFS } from '../../__tests__/ipfs-util';
import { createCeramic } from '../../__tests__/create-ceramic';
import { TileDoctype } from '@ceramicnetwork/doctype-tile';

let ipfs: IpfsApi;

beforeEach(async () => {
  ipfs = await createIPFS();
});

afterEach(async () => {
  await ipfs.stop();
});

test('cache eviction', async () => {
  const ceramic = await createCeramic(ipfs, { docCacheLimit: 1 });
  await ceramic.createDocument('tile', { content: { foo: 'blah' }, deterministic: true });
  expect(ceramic.repository.inmemory.size).toEqual(1);
  await ceramic.createDocument('tile', { content: { foo: 'blah' } });
  expect(ceramic.repository.inmemory.size).toEqual(1);
  await ceramic.close();
});

test('RunningState stops updating after evicted', async () => {
  const ceramic = await createCeramic(ipfs, { docCacheLimit: 1, anchorOnRequest: false });
  const createDocument = () => {
    return ceramic.createDocument<TileDoctype>('tile', { content: { stage: 'initial' }, deterministic: true });
  };
  const document1 = await createDocument();
  const runningState1 = await ceramic.repository.load(document1.id);
  await ceramic.pin.add(document1.id);
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
  expect(document3.state).toEqual(document2.state);

  await ceramic.close();
});

test.todo('StateLink receives updates');
