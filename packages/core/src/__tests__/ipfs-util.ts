import dagJose from 'dag-jose';
import basicsImport from 'multiformats/cjs/src/basics-import.js';
import legacy from 'multiformats/cjs/src/legacy.js';
import IPFS from 'ipfs-core';
import { IpfsApi } from '@ceramicnetwork/common';
import tmp from 'tmp-promise';
import getPort from 'get-port';
import * as _ from 'lodash';

/**
 * Create an IPFS instance
 * @param overrideConfig - IFPS config for override
 */
export async function createIPFS(overrideConfig: Record<string, unknown> = {}): Promise<IpfsApi> {
  basicsImport.multicodec.add(dagJose);
  const format = legacy(basicsImport, dagJose.name);
  const tmpFolder = await tmp.dir({ unsafeCleanup: true });

  const port = await getPort();
  const defaultConfig = {
    ipld: { formats: [format] },
    repo: `${tmpFolder.path}/ipfs${port}/`,
    config: {
      Addresses: { Swarm: [`/ip4/127.0.0.1/tcp/${port}`] },
      Bootstrap: [],
    },
  };

  const config = _.merge({}, defaultConfig, overrideConfig);
  const instance = await IPFS.create(config);

  // IPFS does not notify you when it stops.
  // Here we intercept a call to `ipfs.stop` to clean up IPFS repository folder.
  // Poor man's hook.
  return new Proxy(instance, {
    get(target: any, p: PropertyKey): any {
      if (p === 'stop') {
        tmpFolder.cleanup();
      }
      return target[p];
    },
  });
}

/**
 * Connect two IPFS instances via `swarm.connect`
 *
 * @param a - Initiates connection
 * @param b - Receives connection
 */
export async function swarmConnect(a: IpfsApi, b: IpfsApi) {
  const addressB = (await b.id()).addresses[0].toString();
  await a.swarm.connect(addressB);
}
