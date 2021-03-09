import { AnchorStatus, Context, DocOpts, IpfsApi } from '@ceramicnetwork/common';
import Ceramic from '../../ceramic';
import { TileDoctype, TileParams } from '@ceramicnetwork/doctype-tile';
import * as uint8arrays from 'uint8arrays';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import { Document } from '../../document';
import InMemoryAnchorService from '../../anchor/memory/in-memory-anchor-service';
import { createIPFS } from '../../__tests__/ipfs-util';

const seed = uint8arrays.fromString('6e34b2e1a9624113d81ece8a8a22e6e97f0e145c25c1d4d2d0e62753b4060c83', 'base16');

let ipfs: IpfsApi;
let ceramic: Ceramic;
let ceramicWithoutSchemaValidation: Ceramic;
let anchorService: InMemoryAnchorService;

beforeAll(async () => {
  ipfs = await createIPFS();
});

afterAll(async () => {
  await ipfs.stop();
});

beforeEach(async () => {
  ceramic = await Ceramic.create(ipfs);
  const provider = new Ed25519Provider(seed);
  await ceramic.setDIDProvider(provider);
  anchorService = ceramic.context.anchorService as InMemoryAnchorService;

  ceramicWithoutSchemaValidation = await Ceramic.create(ipfs, { validateDocs: false });
  await ceramicWithoutSchemaValidation.setDIDProvider(provider);
});

afterEach(async () => {
  await ceramic.close();
  await ceramicWithoutSchemaValidation.close();
});

const INITIAL_CONTENT = { abc: 123, def: 456 };
const stringMapSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'StringMap',
  type: 'object',
  additionalProperties: {
    type: 'string',
  },
};

async function create(params: TileParams, ceramic: Ceramic, opts: DocOpts = {}): Promise<TileDoctype> {
  const { content, metadata } = params;
  if (!metadata?.controllers) {
    throw new Error('The controller of the 3ID needs to be specified');
  }

  const record = await TileDoctype.makeGenesis({ content, metadata }, ceramic.context);
  return await ceramic.createDocumentFromGenesis('tile', record, opts);
}

const anchorUpdate = async (anchorService: InMemoryAnchorService, doc: TileDoctype): Promise<void> => {
  await anchorService.anchor();
  return new Promise((resolve) => doc.on('change', resolve));
};

describe('load', () => {
  test('is loaded correctly', async () => {
    const doc1 = await create({ content: INITIAL_CONTENT, metadata: { controllers: [ceramic.did?.id] } }, ceramic, {
      anchor: false,
      publish: false,
      sync: false,
    });
    const loadingQueue = (ceramic as any).loadingQueue;
    const doc2 = await loadingQueue.load(doc1.id, { sync: false });

    expect(doc1.id).toEqual(doc2.id);
    expect(doc1.content).toEqual(INITIAL_CONTENT);
    expect(doc1.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED);
  });

  test('enforce schema when loading genesis record', async () => {
    const schemaDoc = await create({ content: stringMapSchema, metadata: { controllers: [ceramic.did?.id] } }, ceramic);
    await anchorUpdate(anchorService, schemaDoc);

    const docParams = {
      content: { stuff: 1 },
      metadata: { controllers: [ceramic.did?.id], schema: schemaDoc.commitId.toString() },
    };
    // Create a document that isn't conforming to the schema
    const doc = await create(docParams, ceramicWithoutSchemaValidation);
    await anchorUpdate(anchorService, doc);

    expect(doc.content).toEqual({ stuff: 1 });
    expect(doc.metadata.schema).toEqual(schemaDoc.commitId.toString());

    const loadingQueue = (ceramic as any).loadingQueue;
    await expect(loadingQueue.load(doc.id, {sync: false})).rejects.toThrow('Validation Error: data[\'stuff\'] should be string')
  });
});
