import * as dagJose from 'dag-jose'
import { path } from 'go-ipfs'
import * as Ctl from 'ipfsd-ctl'
import * as ipfsClient from 'ipfs-http-client'
import type { Options } from 'ipfs-core'
import { create } from 'ipfs-core'
import getPort from 'get-port'
import mergeOpts from 'merge-options'
import type { IpfsApi } from '@ceramicnetwork/common'
import tmp from 'tmp-promise'

const mergeOptions = mergeOpts.bind({ ignoreUndefined: true })

const ipfsHttpModule = {
  create: (ipfsEndpoint: string) => {
    return ipfsClient.create({
      url: ipfsEndpoint,
      ipld: { codecs: [dagJose] },
    })
  },
}

const ipfsOptions = {
  ipld: { codecs: [dagJose] },
  config: {
    Pubsub: {
      Enabled: true,
    },
    Bootstrap: [],
  },
}

const createFactory = () => {
  return Ctl.createFactory(
    {
      ipfsHttpModule,
      disposable: true,
      ipfsOptions,
    },
    {
      go: {
        ipfsBin: path(),
      },
    }
  )
}

async function createGoIpfsOptions(override: Partial<Options> = {}): Promise<Options> {
  const tmpFolder = await tmp.dir({ unsafeCleanup: true })
  const port = await getPort()
  const swarmPort = await getPort()
  const apiPort = await getPort()
  const gatewayPort = await getPort()

  return mergeOptions(
    {
      repo: `${tmpFolder.path}/ipfs${port}/`,
      config: {
        Addresses: {
          Swarm: [`/ip4/127.0.0.1/tcp/${swarmPort}`],
          Gateway: `/ip4/127.0.0.1/tcp/${gatewayPort}`,
          API: `/ip4/127.0.0.1/tcp/${apiPort}`,
        },
      },
    },
    override
  )
}

/**
 * Create js-ipfs instance
 * @param overrideConfig - IFPS config for override
 */
async function createJsIpfs(overrideConfig: Record<string, unknown> = {}): Promise<IpfsApi> {
  const tmpFolder = await tmp.dir({ unsafeCleanup: true })
  const port = await getPort()

  const config = mergeOptions(
    ipfsOptions,
    {
      repo: `${tmpFolder.path}/ipfs${port}/`,
      config: {
        Addresses: { Swarm: [`/ip4/127.0.0.1/tcp/${port}`] },
      },
    },
    overrideConfig
  )

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
 * Create an IPFS instance
 * @param overrideConfig - IFPS config for override
 */
export async function createIPFS(overrideConfig: Partial<Options> = {}): Promise<IpfsApi> {
  const flavor = process.env.IPFS_FLAVOR || 'go'

  if (flavor && flavor.toLowerCase() == 'js') {
    return createJsIpfs(overrideConfig)
  } else {
    const goIpfsOptions = await createGoIpfsOptions(overrideConfig)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore ipfsd-ctl uses own type, that is _very_ similar to Options from ipfs-core
    const ipfsd = await createFactory().spawn({ type: 'go', ipfsOptions: goIpfsOptions })
    return ipfsd.api
  }
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
  const flavor = process.env.IPFS_FLAVOR || 'go'

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
  task: (instances: IpfsApi[]) => Promise<void>,
  overrideConfig: Record<string, unknown> = {}
): Promise<void> {
  const factory = createFactory()

  const controllers = await Promise.all(
    Array.from({ length: n }).map(async () => {
      const goIpfsOptions = await createGoIpfsOptions(overrideConfig)

      return factory.spawn({
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore ipfsd-ctl uses own type, that is _very_ similar to Options from ipfs-core
        ipfsOptions: goIpfsOptions,
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
 * Start `n` js-ipfs instances, and stop them after `task` is done.
 * @param n - Number of js-ipfs instances to create.
 * @param task - Function that uses the IPFS instances.
 */
async function withJsFleet(
  n: number,
  task: (instances: IpfsApi[]) => Promise<void>,
  overrideConfig: Record<string, unknown> = {}
): Promise<void> {
  const instances = await Promise.all(
    Array.from({ length: n }).map(() => createJsIpfs(overrideConfig))
  )
  try {
    await task(instances)
  } finally {
    instances.map((instance) => instance.stop())
  }
}
