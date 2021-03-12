import Ceramic, { CeramicConfig } from '../ceramic';
import { IpfsApi } from '@ceramicnetwork/common';
import * as uint8arrays from 'uint8arrays';
import * as sha256 from '@stablelib/sha256';
import tmp from 'tmp-promise';
import { Ed25519Provider } from 'key-did-provider-ed25519';

export async function createCeramic(ipfs: IpfsApi, config?: CeramicConfig & { seed?: string }): Promise<Ceramic> {
  const appliedConfig = {
    stateStoreDirectory: await tmp.tmpName(),
    anchorOnRequest: false,
    docCacheLimit: 100,
    restoreDocuments: false,
    pubsubTopic: '/ceramic/inmemory/test', // necessary so Ceramic instances can talk to each other
    ...config,
  };
  const ceramic = await Ceramic.create(ipfs, appliedConfig);
  const seed = sha256.hash(uint8arrays.fromString(appliedConfig.seed || 'SEED'));
  const provider = new Ed25519Provider(seed);
  await ceramic.setDIDProvider(provider);

  return ceramic;
}
