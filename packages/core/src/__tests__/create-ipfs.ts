import dagJose from 'dag-jose';
import basicsImport from 'multiformats/cjs/src/basics-import.js';
import legacy from 'multiformats/cjs/src/legacy.js';
import IPFS from 'ipfs-core';
import { IpfsApi } from '@ceramicnetwork/common';

/**
 * Create an IPFS instance
 * @param overrideConfig - IFPS config for override
 */
export function createIPFS(overrideConfig: Record<string, unknown> = {}): Promise<IpfsApi> {
  basicsImport.multicodec.add(dagJose);
  const format = legacy(basicsImport, dagJose.name);

  const config = {
    ipld: { formats: [format] },
  };

  Object.assign(config, overrideConfig);
  return IPFS.create(config);
}
