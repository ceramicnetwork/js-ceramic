import * as dagJose from 'dag-jose'
import { path } from 'go-ipfs'
import * as Ctl from 'ipfsd-ctl'
import * as ipfsHttp from 'ipfs-http-client'
import type { IPFS, Options } from 'ipfs-core'
import getPort from 'get-port'
import mergeOpts from 'merge-options'

const mergeOptions = mergeOpts.bind({ ignoreUndefined: true })

/**
 * Create an IPFS instance
 * @param overrideConfig - IFPS config for override
 */
/**
 * Create an IPFS instance
 * @param overrideConfig - IFPS config for override
 */
export async function createIPFS(overrideConfig: Partial<Options> = {}): Promise<IPFS> {
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
 * Connect two IPFS instances via `swarm.connect`
 *
 * @param a - Initiates connection
 * @param b - Receives connection
 */
export async function swarmConnect(a: IPFS, b: IPFS) {
  const addressB = (await b.id()).addresses[0]
  await a.swarm.connect(addressB)
}

/**
 * Instantiate a number of IPFS instances
 * @param n - number of ipfs instances
 * @param overrideConfig - IPFS config for override
 */
export function fleet(n: number, overrideConfig: Record<string, unknown> = {}): Promise<IPFS[]> {
  return Promise.all(Array.from({ length: n }).map(() => createIPFS(overrideConfig)))
}

/**
 * Start `n` IPFS instances, and stop them after `task` is done.
 * @param n - Number of IPFS instances to create.
 * @param task - Function that uses the IPFS instances.
 */
export async function withFleet(
  n: number,
  task: (instances: IPFS[]) => Promise<void>
): Promise<void> {
  const instances = await fleet(n)
  try {
    await task(instances)
  } finally {
    instances.map((instance) => instance.stop())
  }
}
