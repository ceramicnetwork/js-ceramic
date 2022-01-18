import * as dagJose from 'dag-jose'
import { path } from 'go-ipfs'
import * as Ctl from 'ipfsd-ctl'
import * as ipfsHttp from 'ipfs-http-client'
import type { Options } from 'ipfs-core'
// import { create } from 'ipfs-core'
import getPort from 'get-port'
import mergeOpts from 'merge-options'
import type { IpfsApi } from '@ceramicnetwork/common'
import tmp from 'tmp-promise'

const mergeOptions = mergeOpts.bind({ ignoreUndefined: true })

const ipfsHttpModule = {
  create: (ipfsEndpoint: string) => {
    return ipfsHttp.create({
      url: ipfsEndpoint,
      ipld: { codecs: [dagJose] },
    })
  },
}

/**
 * Create an IPFS instance
 * @param overrideConfig - IFPS config for override
 */
export async function createIPFS(overrideConfig: Partial<Options> = {}): Promise<IpfsApi> {
  const flavor = process.env.IPFS_FLAVOR
  if (flavor && flavor.toLowerCase() == 'js') {
    throw new Error(`TODO IPFS`)
    // return createJsIPFS(overrideConfig)
  } else {
    return createGoIPFS(overrideConfig)
  }
}

/**
 * Create go-ipfs instance
 * @param overrideConfig - IFPS config for override
 */
async function createGoIPFS(overrideConfig: Partial<Options> = {}): Promise<IpfsApi> {
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
    ipfsHttpModule: ipfsHttpModule,
    ipfsBin: path(),
    ipfsOptions: appliedConfig,
    disposable: true,
  })
  return ipfsd.api
}

/**
 * Create js-ipfs instance
 * @param overrideConfig - IFPS config for override
 */
// async function createJsIPFS(overrideConfig: Record<string, unknown> = {}): Promise<IpfsApi> {
//   const tmpFolder = await tmp.dir({ unsafeCleanup: true })
//
//   const port = await getPort()
//   const defaultConfig = {
//     ipld: { codecs: [dagJose] },
//     repo: `${tmpFolder.path}/ipfs${port}/`,
//     config: {
//       Addresses: { Swarm: [`/ip4/127.0.0.1/tcp/${port}`] },
//       Bootstrap: [],
//     },
//   }
//
//   const config = { ...defaultConfig, ...overrideConfig }
//   const instance = await create(config)
//
//   // IPFS does not notify you when it stops.
//   // Here we intercept a call to `ipfs.stop` to clean up IPFS repository folder.
//   // Poor man's hook.
//   return new Proxy(instance, {
//     get(target: any, p: PropertyKey): any {
//       if (p === 'stop') {
//         tmpFolder.cleanup()
//       }
//       return target[p]
//     },
//   })
// }
