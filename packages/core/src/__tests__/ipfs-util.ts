import type { IpfsApi } from '@ceramicnetwork/common'
import * as dagJose from 'dag-jose'
import { path } from 'go-ipfs'
import * as Ctl from 'ipfsd-ctl'
import * as ipfsHttp from 'ipfs-http-client'
import type { Options } from 'ipfs-core'
import getPort from 'get-port'
import mergeOpts from 'merge-options'

const mergeOptions = mergeOpts.bind({ ignoreUndefined: true })

async function ipfsConfig(override: Partial<Options> = {}): Promise<Options> {
  const swarmPort = await getPort()
  const apiPort = await getPort()
  const gatewayPort = await getPort()
  const defaultConfig: Partial<Options> = {
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

  return mergeOptions(defaultConfig, override) as Options
}

/**
 * Create an IPFS instance
 * @param overrideConfig - IFPS config for override
 */
/**
 * Create an IPFS instance
 * @param overrideConfig - IFPS config for override
 */
export async function createIPFS(overrideConfig: Partial<Options> = {}): Promise<IpfsApi> {
  const ipfsOptions = await ipfsConfig(overrideConfig)

  const ipfsd = await Ctl.createController({
    ipfsHttpModule: ipfsHttp,
    ipfsBin: path(),
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore ipfsd-ctl uses own type, that is _very_ similar to Options from ipfs-core
    ipfsOptions: ipfsOptions,
    disposable: true,
  })
  return ipfsd.api
}
/**
 * Connect two IPFS instances via `swarm.connect`
 *
 * @param a - Initiates connection
 * @param b - Receives connection
 */
export async function swarmConnect(a: IpfsApi, b: IpfsApi) {
  const addressB = (await b.id()).addresses[0]
  const addressA = (await a.id()).addresses[0]
  await a.swarm.connect(addressB)
  await b.swarm.connect(addressA)
}

/**
 * Start `n` IPFS instances, and stop them after `task` is done.
 * @param n - Number of IPFS instances to create.
 * @param task - Function that uses the IPFS instances.
 */
export async function withFleet(
  n: number,
  task: (instances: IpfsApi[]) => Promise<void>
): Promise<void> {
  // const instances = await fleet(n)
  const factory = Ctl.createFactory({
    ipfsHttpModule: ipfsHttp,
    ipfsBin: path(),
    disposable: true,
  })
  const controllers = await Promise.all(
    Array.from({ length: n }).map(async () => {
      const ipfsOptions = await ipfsConfig()

      return factory.spawn({
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore ipfsd-ctl uses own type, that is _very_ similar to Options from ipfs-core
        ipfsOptions: ipfsOptions,
      })
    })
  )
  const instances = controllers.map((c) => c.api)
  try {
    await task(instances)
  } finally {
    await factory.clean()
  }
}
