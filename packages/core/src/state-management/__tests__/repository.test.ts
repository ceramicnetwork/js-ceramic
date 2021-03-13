import { IpfsApi } from '@ceramicnetwork/common';
import Ceramic from '../../ceramic';
import { createIPFS } from '../../__tests__/ipfs-util';
import { Repository } from '../repository';
import { anchorUpdate } from './anchor-update';
import { createCeramic } from '../../__tests__/create-ceramic';

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
    const doc1 = await ceramic.createDocument('tile', {
      content: { foo: Math.random().toString() },
      metadata: { controllers },
    });
    const fromMemorySpy = jest.spyOn(repository, 'fromMemory');
    const fromStateStoreSpy = jest.spyOn(repository, 'fromStateStore');
    const fromNetwork = jest.spyOn(repository, 'fromNetwork');
    const doc2 = await repository.load(doc1.id, { sync: false });
    expect(doc1.state).toEqual(doc2.state);
    expect(fromMemorySpy).toBeCalledTimes(1);
    expect(fromStateStoreSpy).toBeCalledTimes(0);
    expect(fromNetwork).toBeCalledTimes(0);
  });
});

describe('validation', () => {
  test('when loading genesis ', async () => {
    // Create schema
    const schema = await ceramic.createDocument('tile', {
      content: STRING_MAP_SCHEMA,
      metadata: { controllers },
    });
    await anchorUpdate(ceramic, schema);
    // Create invalid doc
    const permissiveCeramic = await createCeramic(ipfs, { validateDocs: false });
    const invalidDoc = await permissiveCeramic.createDocument('tile', {
      content: { stuff: 1 },
      metadata: { controllers, schema: schema.commitId.toString() },
    });
    await permissiveCeramic.close();
    // Load it: Expect failure
    await expect(repository.load(invalidDoc.id)).rejects.toThrow("Validation Error: data['stuff'] should be string");
  }, 10000);
});
