import type { IpfsApi } from '@ceramicnetwork/common'
import * as dagJose from 'dag-jose'
import { path } from 'go-ipfs'
import * as Ctl from 'ipfsd-ctl'
import * as ipfsHttp from 'ipfs-http-client'
import type { Options } from 'ipfs-core'
import getPort from 'get-port'
import mergeOpts from 'merge-options'
import tmp from 'tmp-promise'
import { create } from 'ipfs-core'

const mergeOptions = mergeOpts.bind({ ignoreUndefined: true })

const ipfsHttpModule = {
  create: (ipfsEndpoint: string) => {
    return ipfsHttp.create({
      url: ipfsEndpoint,
      ipld: { codecs: [dagJose] },
    })
  },
}

async function goIpfsConfig(override: Partial<Options> = {}): Promise<Options> {
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
export async function createIPFS(overrideConfig: Partial<Options> = {}): Promise<IpfsApi> {
  const flavor = process.env.IPFS_FLAVOR
  if (flavor && flavor.toLowerCase() == 'js') {
    return createJsIPFS(overrideConfig)
  } else {
    return createGoIPFS(overrideConfig)
  }
}

/**
 * Create go-ipfs instance
 * @param overrideConfig - IFPS config for override
 */
async function createGoIPFS(overrideConfig: Partial<Options> = {}): Promise<IpfsApi> {
  const ipfsOptions = await goIpfsConfig(overrideConfig)

  const ipfsd = await Ctl.createController({
    ipfsHttpModule: ipfsHttpModule,
    ipfsBin: path(),
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore ipfsd-ctl uses own type, that is _very_ similar to Options from ipfs-core
    ipfsOptions: ipfsOptions,
    disposable: true,
  })
  return ipfsd.api
}

/**
 * Create js-ipfs instance
 * @param overrideConfig - IFPS config for override
 */
async function createJsIPFS(overrideConfig: Record<string, unknown> = {}): Promise<IpfsApi> {
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
        return () => {
          const vanilla = target[p]
          return vanilla().finally(() => tmpFolder.cleanup())
        }
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
  const addressA = (await a.id()).addresses[0]
  await a.swarm.connect(addressB)
  await b.swarm.connect(addressA)
}

/**
 * Start `n` IPFS (go-ipfs or js-ipfs based on `process.env.IPFS_FLAVOR`) instances, and stop them after `task` is done.
 * @param n - Number of IPFS instances to create.
 * @param task - Function that uses the IPFS instances.
 */
export async function withFleet(
  n: number,
  task: (instances: IpfsApi[]) => Promise<void>
): Promise<void> {
  const flavor = process.env.IPFS_FLAVOR
  if (flavor && flavor.toLowerCase() == 'js') {
    return withJsFleet(n, task)
  } else {
    return withGoFleet(n, task)
  }
}

/**
 * Start `n` go-ipfs instances, and stop them after `task` is done.
 * @param n - Number of go-ipfs instances to create.
 * @param task - Function that uses go-ipfs instances.
 */
async function withGoFleet(
  n: number,
  task: (instances: IpfsApi[]) => Promise<void>
): Promise<void> {
  // const instances = await fleet(n)
  const factory = Ctl.createFactory({
    ipfsHttpModule: ipfsHttpModule,
    ipfsBin: path(),
    disposable: true,
  })
  const controllers = await Promise.all(
    Array.from({ length: n }).map(async () => {
      const ipfsOptions = await goIpfsConfig()

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

/**
 * Instantiate a number of js-ipfs instances
 * @param n - number of js-ipfs instances
 * @param overrideConfig - IPFS config for override
 */
function fleet(n: number, overrideConfig: Record<string, unknown> = {}): Promise<IpfsApi[]> {
  return Promise.all(Array.from({ length: n }).map(() => createJsIPFS(overrideConfig)))
}

/**
 * Start `n` js-ipfs instances, and stop them after `task` is done.
 * @param n - Number of js-ipfs instances to create.
 * @param task - Function that uses the IPFS instances.
 */
async function withJsFleet(
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
