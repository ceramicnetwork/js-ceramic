import { createIPFS } from './ipfs-util';
import { IpfsApi } from '@ceramicnetwork/common';
import Ceramic from '../ceramic';
import tmp from 'tmp-promise';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import * as u8a from 'uint8arrays';

let ipfs: IpfsApi;

beforeEach(async () => {
  ipfs = await createIPFS();
});

afterEach(async () => {
  await ipfs.stop();
});

function delay(mills: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(() => resolve(), mills));
}

const seed = u8a.fromString('6e34b2e1a9624113d81ece8a8a22e6e97f0e145c25c1d4d2d0e62753b4060c83', 'base16');

const createCeramic = async (
  ipfs: IpfsApi,
  anchorOnRequest = false,
  docCacheLimit = 100,
  cacheDocumentCommits = true,
): Promise<Ceramic> => {
  const ceramic = await Ceramic.create(ipfs, {
    pinsetDirectory: await tmp.tmpName(),
    anchorOnRequest,
    docCacheLimit,
    cacheDocCommits: cacheDocumentCommits,
    restoreDocuments: false,
    pubsubTopic: '/ceramic/inmemory/test', // necessary so Ceramic instances can talk to each other
  });
  const provider = new Ed25519Provider(seed);
  await ceramic.setDIDProvider(provider);

  return ceramic;
};

it('can close ceramic, no delay', async () => {
  const ceramic = await createCeramic(ipfs);
  // await delay(1000);
  await ceramic.close();
});

it('can close ceramic, with delay', async () => {
  const ceramic = await createCeramic(ipfs);
  await delay(1000);
  await ceramic.close();
});

it('can close ceramic right after creating document', async () => {
  const ceramic = await createCeramic(ipfs);
  const document = await ceramic.createDocument('tile', {
    metadata: { controllers: [ceramic.did?.id] },
    content: {
      foo: 'blah',
    },
  });
  await ceramic.close();
});
