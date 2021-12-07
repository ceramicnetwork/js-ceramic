import * as dagJose from 'dag-jose'
import { create } from 'ipfs-core'
import { IpfsApi } from '@ceramicnetwork/common'
import tmp from 'tmp-promise'
import getPort from 'get-port'

/**
 * Create an IPFS instance
 * @param overrideConfig - IFPS config for override
 */
export async function createIPFS(overrideConfig: Record<string, unknown> = {}): Promise<IpfsApi> {
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

/**
 * Connect two IPFS instances via `swarm.connect`
 *
 * @param a - Initiates connection
 * @param b - Receives connection
 */
export async function swarmConnect(a: IpfsApi, b: IpfsApi) {
  const addressB = (await b.id()).addresses[0]
  await a.swarm.connect(addressB)
}

/**
 * Instantiate a number of IPFS instances
 * @param n - number of ipfs instances
 * @param overrideConfig - IPFS config for override
 */
export function fleet(n: number, overrideConfig: Record<string, unknown> = {}): Promise<IpfsApi[]> {
  return Promise.all(Array.from({ length: n }).map(() => createIPFS(overrideConfig)))
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
  const instances = await fleet(n)
  try {
    await task(instances)
  } finally {
    instances.map((instance) => instance.stop())
  }
}
