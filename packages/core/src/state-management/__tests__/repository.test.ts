import { StreamUtils, IpfsApi } from '@ceramicnetwork/common';
import { TileDocument } from "@ceramicnetwork/doctype-tile";
import Ceramic from '../../ceramic';
import { createIPFS } from '../../__tests__/ipfs-util';
import { Repository } from '../repository';
import { anchorUpdate } from './anchor-update';
import { createCeramic } from '../../__tests__/create-ceramic';
import { delay } from '../../pubsub/__tests__/delay';

let ipfs: IpfsApi;
let ceramic: Ceramic;

let repository: Repository;
let controllers: string[];

beforeAll(async () => {
  ipfs = await createIPFS();
  ceramic = await createCeramic(ipfs);

  repository = ceramic.repository;
  controllers = [ceramic.did.id];
});

afterAll(async () => {
  await ceramic.close();
  await ipfs.stop();
});

const STRING_MAP_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'StringMap',
  type: 'object',
  additionalProperties: {
    type: 'string',
  },
};

describe('load', () => {
  test('from memory', async () => {
    const doc1 = await TileDocument.create(ceramic, { foo: 'bar' });
    doc1.subscribe();
    const fromMemorySpy = jest.spyOn(repository, 'fromMemory');
    const fromStateStoreSpy = jest.spyOn(repository, 'fromStateStore');
    const fromNetwork = jest.spyOn(repository, 'fromNetwork');
    const doc2 = await repository.load(doc1.id, { syncTimeoutSeconds: 0 });
    expect(StreamUtils.statesEqual(doc1.state, doc2.state)).toBeTruthy();
    expect(fromMemorySpy).toBeCalledTimes(1);
    expect(fromStateStoreSpy).toBeCalledTimes(0);
    expect(fromNetwork).toBeCalledTimes(0);
  });
});

describe('validation', () => {
  test('when loading genesis ', async () => {
    // Create schema
    const schema = await TileDocument.create(ceramic, STRING_MAP_SCHEMA);
    await anchorUpdate(ceramic, schema);
    // Create invalid doc
    const ipfs2 = await createIPFS();
    const permissiveCeramic = await createCeramic(ipfs2, { validateStreams: false });
    const invalidDoc = await TileDocument.create(permissiveCeramic, { stuff: 1 }, { schema: schema.commitId });
    // Load it: Expect failure
    await expect(repository.load(invalidDoc.id, { syncTimeoutSeconds: 0 })).rejects.toThrow(
      "Validation Error: data['stuff'] should be string",
    );
    await permissiveCeramic.close();
    await ipfs2.stop();
  }, 20000);
});

test('subscribe makes state endured', async () => {
  const durableStart = ceramic.repository.inmemory.durable.size;
  const volatileStart = ceramic.repository.inmemory.volatile.size;
  const doc1 = await TileDocument.create(ceramic, { foo: 'bar' });
  expect(ceramic.repository.inmemory.durable.size).toEqual(durableStart);
  expect(ceramic.repository.inmemory.volatile.size).toEqual(volatileStart + 1);
  doc1.subscribe();
  await delay(200); // Wait for rxjs plumbing
  expect(ceramic.repository.inmemory.durable.size).toEqual(durableStart + 1);
  expect(ceramic.repository.inmemory.volatile.size).toEqual(volatileStart);
});
