import { IpfsApi } from '@ceramicnetwork/common';
import getPort from 'get-port';
import { sha256 } from 'multiformats/hashes/sha2';
import legacy from 'multiformats/legacy';
import dagJose from 'dag-jose';
import IPFS from 'ipfs-core';

/**
 * Create an IPFS instance
 */
export async function createIPFS(path: string): Promise<IpfsApi> {
  const port = await getPort();
  const hasher = {};
  hasher[sha256.code] = sha256;
  const format = legacy(dagJose, { hashes: hasher });

  const config = {
    ipld: { formats: [format] },
    repo: `${path}/ipfs${port}/`,
    config: {
      Addresses: { Swarm: [`/ip4/127.0.0.1/tcp/${port}`] },
      Discovery: { DNS: { Enabled: false }, webRTCStar: { Enabled: false } },
      Bootstrap: [],
    },
  };

  // @ts-ignore
  return IPFS.create(config);
}
