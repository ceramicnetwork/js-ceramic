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
  });
});
