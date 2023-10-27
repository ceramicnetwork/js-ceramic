import { path } from 'go-ipfs'
import * as Ctl from 'ipfsd-ctl'
import * as ipfsClient from 'ipfs-http-client'
import getPort from 'get-port'
import mergeOpts from 'merge-options'
import type { IpfsApi } from '@ceramicnetwork/common'
import tmp from 'tmp-promise'
import { RustIpfsOptions, RustIpfs, RustIpfsRemoteOptions } from './rust-ipfs.js'
import { IPFSOptions } from 'ipfsd-ctl'
import { DiagnosticsLogger } from '@ceramicnetwork/common'

const mergeOptions = mergeOpts.bind({ ignoreUndefined: true })

const ipfsHttpModule = {
  create: (ipfsEndpoint: string) => {
    return ipfsClient.create({
      url: ipfsEndpoint,
    })
  },
}

const createFactory = () => {
  return Ctl.createFactory(
    {
      ipfsHttpModule,
      ipfsOptions: {
        repoAutoMigrate: true,
      },
    },
    {
      go: {
        ipfsBin: path(),
      },
    }
  )
}

class GoRunningIpfs implements RunningIpfs {
  private readonly _api: IpfsApi

  constructor(api: IpfsApi) {
    this._api = api
  }

  api(): IpfsApi {
    return this._api
  }

  isOnline(): boolean {
    return this._api.isOnline()
  }

  async shutdown(logger?: DiagnosticsLogger): Promise<void> {
    return await this._api.stop()
  }
}

export async function createGoController(
  ipfsOptions: Ctl.IPFSOptions,
  disposable = true
): Promise<Ctl.Controller> {
  const ipfsd = await createFactory().spawn({
    type: 'go',
    ipfsOptions,
    disposable,
  })
  if (disposable) {
    return ipfsd
  }

  return ipfsd.init()
}

/**
 * Create the default IPFS Options
 * @param override IFPS config for override
 * @param repoPath The file path at which to store the IPFS node’s data
 * @returns
 */

async function createIpfsOptions(
  override: Partial<Ctl.IPFSOptions> = {},
  repoPath?: string
): Promise<Ctl.IPFSOptions> {
  const swarmPort = await getPort()
  const apiPort = await getPort()
  const gatewayPort = await getPort()

  // The default options do not peer with any nodes and do not have any discovery mechanism.
  return mergeOptions(
    {
      start: true,
      config: {
        Addresses: {
          Swarm: [`/ip4/127.0.0.1/tcp/${swarmPort}`],
          Gateway: `/ip4/127.0.0.1/tcp/${gatewayPort}`,
          API: `/ip4/127.0.0.1/tcp/${apiPort}`,
        },
        Pubsub: {
          Enabled: true,
          SeenMessagesTTL: '10m',
        },
        Bootstrap: [],
        Discovery: {
          MDNS: {
            Enabled: false,
          },
        },
      },
    },
    repoPath ? { repo: `${repoPath}/ipfs${swarmPort}/` } : {},
    override
  )
}

export type GoIpfsFlavor = {
  name: 'go'
  options: IPFSOptions
}

export type RustIpfsFlavor = {
  name: 'rust'
  options: RustIpfsOptions
}

type IpfsFlavor = GoIpfsFlavor | RustIpfsFlavor

export async function createIPFS(goOptions: IPFSOptions = {}, disposable = true, rustOptions: RustIpfsOptions = { type: 'binary' } as RustIpfsOptions): Promise<IpfsApi> {
  const env_flavor = process.env.IPFS_FLAVOR || 'go'
  if (env_flavor == 'go') {
    return (
      await createIPFSFlavor(
        {
          name: 'go',
          options: goOptions,
        } as GoIpfsFlavor,
        disposable
      )
    ).api()
  } else {
    return (
      await createIPFSFlavor(
        {
          name: 'rust',
          options: rustOptions,
        } as RustIpfsFlavor,
        disposable
      )
    ).api()
  }
}

export interface RunningIpfs {
  api(): IpfsApi

  shutdown(logger?: DiagnosticsLogger): Promise<void>
}

/**
 * Create an IPFS instance
 * @param flavor - IPFS flavor to create
 * @param disposable - Stop the IPFS process when its no longer needed.
 */
export async function createIPFSFlavor(
  flavor: IpfsFlavor,
  disposable = true
): Promise<RunningIpfs> {
  switch (flavor.name) {
    case 'go': {
      let options
      let tmpFolder
      if (flavor.options.repo) {
        options = await createIpfsOptions(flavor.options)
      } else {
        tmpFolder = await tmp.dir({ unsafeCleanup: true })

        options = await createIpfsOptions(flavor.options, tmpFolder.path)
      }

      const ipfsd = await createGoController(options, disposable)
      // API is only set on started controllers
      const started = await ipfsd.start()
      if (!tmpFolder) {
        return new GoRunningIpfs(started.api)
      } else {
        // IPFS does not notify you when it stops.
        // Here we intercept a call to `ipfs.stop` to clean up IPFS repository folder.
        // Poor man's hook.
        const p = new Proxy(started.api, {
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
        return new GoRunningIpfs(p)
      }
    }
    case 'rust': {
      const ipfs = new RustIpfs(flavor.options)
      return await ipfs.start()
    }
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
 * Start `n` go-ipfs instances, and stop them after `task` is done.
 * @param n - Number of go-ipfs instances to create.
 * @param task - Function that uses go-ipfs instances.
 * @param overrideConfig - config to pass to go-ipfs
 */
export async function withFleet(
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
