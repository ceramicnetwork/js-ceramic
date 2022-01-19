import * as dagJose from 'dag-jose'
import { path } from 'go-ipfs'
import * as Ctl from 'ipfsd-ctl'
import * as ipfsClient from 'ipfs-http-client'
import type { Options } from 'ipfs-core'
import { create as createJsIpfs } from 'ipfs-core'
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

const createFactory = () => {
  return Ctl.createFactory(
    {
      ipfsHttpModule,
    },
    {
      go: {
        ipfsBin: path(),
      },
    }
  )
}

/**
 * Create the default IPFS Options
 * @param override IFPS config for override
 * @param repoPath The file path at which to store the IPFS node’s data
 * @returns
 */

async function createIpfsOptions(
  override: Partial<Options> = {},
  repoPath?: string
): Promise<Options> {
  const swarmPort = await getPort()
  const apiPort = await getPort()
  const gatewayPort = await getPort()

  return mergeOptions(
    {
      ipld: { codecs: [dagJose] },
      config: {
        Addresses: {
          Swarm: [`/ip4/127.0.0.1/tcp/${swarmPort}`],
          Gateway: `/ip4/127.0.0.1/tcp/${gatewayPort}`,
          API: `/ip4/127.0.0.1/tcp/${apiPort}`,
        },
        Pubsub: {
          Enabled: true,
        },
        Bootstrap: [],
      },
    },
    repoPath ? { repo: `${repoPath}/ipfs${swarmPort}/` } : {},
    override
  )
}

const createInstanceByType = {
  js: (ipfsOptions: Options) => createJsIpfs(ipfsOptions),
  go: async (ipfsOptions: Options, disposable = true): Promise<IpfsApi> => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore ipfsd-ctl uses own type, that is _very_ similar to Options from ipfs-core
    const ipfsd = await createFactory().spawn({ type: 'go', ipfsOptions, disposable })
    return ipfsd.api
  },
}
/**
 * Create an IPFS instance
 * @param overrideConfig - IFPS config for override
 */
export async function createIPFS(
  overrideConfig: Partial<Options> = {},
  disposable = true
): Promise<IpfsApi> {
  const flavor = process.env.IPFS_FLAVOR || 'go'

  if (!overrideConfig.repo || flavor == 'js') {
    const tmpFolder = await tmp.dir({ unsafeCleanup: true })

    const ipfsOptions = await createIpfsOptions(overrideConfig, tmpFolder.path)

    const instance = await createInstanceByType[flavor](ipfsOptions, disposable)

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

  const ipfsOptions = await createIpfsOptions(overrideConfig)

  return createInstanceByType[flavor](ipfsOptions, disposable)
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

  if (flavor.toLowerCase() == 'js') {
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
      const ipfsOptions = await createIpfsOptions(overrideConfig)
      return factory.spawn({
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore ipfsd-ctl uses own type, that is _very_ similar to Options from ipfs-core
        ipfsOptions,
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
    Array.from({ length: n }).map(() => createIPFS(overrideConfig))
  )
  try {
    await task(instances)
  } finally {
    instances.map((instance) => instance.stop())
  }
}
