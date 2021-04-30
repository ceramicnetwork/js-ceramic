import { IpfsApi } from '@ceramicnetwork/common';
import getPort from 'get-port';
import { convert } from 'blockcodec-to-ipld-format'
import dagJose from 'dag-jose';
import IPFS from 'ipfs-core';

/**
 * Create an IPFS instance
 */
export async function createIPFS(path: string): Promise<IpfsApi> {
  const port = await getPort();
  const format = convert(dagJose);

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
