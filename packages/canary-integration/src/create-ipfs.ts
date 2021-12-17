import * as dagJose from 'dag-jose'
import { path } from 'go-ipfs'
import * as Ctl from 'ipfsd-ctl'
import * as ipfsHttp from 'ipfs-http-client'
import type { IPFS, Options } from 'ipfs-core'
import { create } from 'ipfs-core'
import getPort from 'get-port'
import mergeOpts from 'merge-options'
import type { IpfsApi } from '@ceramicnetwork/common'
import tmp from 'tmp-promise'

const mergeOptions = mergeOpts.bind({ ignoreUndefined: true })

/**
 * Create an IPFS instance
 * @param overrideConfig - IFPS config for override
 */
export async function createIPFS(overrideConfig: Partial<Options> = {}): Promise<IPFS> {
  const flavor = process.env.IPFS_FLAVOR
  if (flavor && flavor.toLowerCase() == 'js') {
    return createJSIPFS(overrideConfig)
  } else {
    return createGoIPFS(overrideConfig)
  }
}

/**
 * Create an IPFS instance
 * @param overrideConfig - IFPS config for override
 */
export async function createGoIPFS(overrideConfig: Partial<Options> = {}): Promise<IPFS> {
  const swarmPort = await getPort()
  const apiPort = await getPort()
  const gatewayPort = await getPort()
  const defaultConfig = {
    ipld: { codecs: [dagJose] },
    config: {
      Pubsub: {
        Enabled: true,
      },
      Addresses: {
        Swarm: [`/ip4/127.0.0.1/tcp/${swarmPort}`],
        Gateway: `/ip4/127.0.0.1/tcp/${gatewayPort}`,
        API: `/ip4/127.0.0.1/tcp/${apiPort}`,
      },
      Bootstrap: [],
    },
  }

  const appliedConfig = mergeOptions(defaultConfig, overrideConfig)

  const ipfsd = await Ctl.createController({
    ipfsHttpModule: ipfsHttp,
    ipfsBin: path(),
    ipfsOptions: appliedConfig,
    disposable: true,
  })
  return ipfsd.api
}

/**
 * Create an IPFS instance
 * @param overrideConfig - IFPS config for override
 */
export async function createJSIPFS(overrideConfig: Record<string, unknown> = {}): Promise<IpfsApi> {
  const tmpFolder = await tmp.dir({ unsafeCleanup: true })

  const port = await getPort()
  const defaultConfig = {
    ipld: { codecs: [dagJose] },
    repo: `${tmpFolder.path}/ipfs${port}/`,
    config: {
      Addresses: { Swarm: [`/ip4/127.0.0.1/tcp/${port}`] },
      Bootstrap: [],
    },
  }

  const config = { ...defaultConfig, ...overrideConfig }
  const instance = await create(config)

  // IPFS does not notify you when it stops.
  // Here we intercept a call to `ipfs.stop` to clean up IPFS repository folder.
  // Poor man's hook.
  return new Proxy(instance, {
    get(target: any, p: PropertyKey): any {
      if (p === 'stop') {
        tmpFolder.cleanup()
      }
      return target[p]
    },
  })
}
