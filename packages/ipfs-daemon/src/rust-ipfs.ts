import getPort, { portNumbers } from 'get-port'
import tmp from 'tmp-promise'
import { type IpfsApi, Networks } from '@ceramicnetwork/common'
import { create as createIpfsClient } from 'ipfs-http-client'
import { RunningIpfs } from './create-ipfs.js'
import { DiagnosticsLogger } from '@ceramicnetwork/common'
import { spawn, ChildProcess } from 'child_process'
import fs from 'node:fs'
import path from 'node:path'

export type RustIpfsRemoteOptions = {
  type: 'remote'
  host: string
  port: number
}

export type RustIpfsBinaryOptions = {
  type: 'binary'
  path: string
  port: number
  network: Networks
  /// Must be set if the network is local
  networkId?: number
  storeDir: string
}

export type RustIpfsOptions = RustIpfsRemoteOptions | RustIpfsBinaryOptions

class BinaryRunningIpfs implements RunningIpfs {
  private readonly _api: IpfsApi
  private readonly proc: ChildProcess
  private readonly dir: tmp.DirectoryResult

  constructor(proc: ChildProcess, api: IpfsApi, dir: tmp.DirectoryResult) {
    this.proc = proc
    this.dir = dir
    const shutdown = this.shutdown.bind(this)
    this._api = new Proxy(api, {
      get(target: any, p: PropertyKey): any {
        if (p === 'stop') {
          return shutdown
        }
        return target[p]
      },
    })
  }

  api(): IpfsApi {
    return this._api
  }

  async shutdown(logger?: DiagnosticsLogger): Promise<void> {
    try {
      this.proc.kill()
      await this.dir.cleanup()
    } catch (e) {
      if (logger) {
        logger.err(`Failed to shutdown binary Rust IPFS: ${e}`)
      }
    }
  }
}

async function binary(
  binary_path: string,
  networkName: Networks,
  port?: number,
  storeDir?: string,
  networkId = 0
): Promise<RunningIpfs> {
  // rely on the defaults and let the operator set CERAMIC_ONE_* environment variables
  // directly for things we don't need to override for tests.
  let dir
  if (storeDir) {
    dir = { path: storeDir, cleanup: async () => {} }
  } else if (networkName === Networks.INMEMORY) {
    dir = await tmp.dir({ unsafeCleanup: true })
  } else {
    throw new Error('The ceramic one store must be set when not using an in-memory network')
  }
  let apiPort = port
  if (!apiPort) {
    apiPort = await getPort()
  }
  const proc = spawn(
    binary_path,
    [
      'daemon',
      '--bind-address',
      `0.0.0.0:${apiPort}`,
      '--store-dir',
      dir.path,
      '--network',
      networkName === Networks.INMEMORY ? 'in-memory' : networkName,
      // We can use a hard coded local network id since
      // nodes that should not be in the same network will never discover each other
      '--local-network-id',
      networkId.toString(),
    ],
    {
      env: {
        RUST_LOG: process.env.RUST_LOG || 'info',
      },
      stdio: 'inherit',
    }
  )
  const ipfs = createIpfsClient({
    host: '127.0.0.1',
    port: apiPort,
  })
  ipfs.config.get = async (key: string): Promise<string | object> => {
    if (key === 'Addresses.API') {
      return `http://127.0.0.1:${apiPort}`
    }
    return ''
  }

  let ipfsOnline = false
  while (!ipfsOnline) {
    try {
      await ipfs.id()
      ipfsOnline = true
    } catch (e) {
      await new Promise((f) => setTimeout(f, 1000))
    }
  }
  return new BinaryRunningIpfs(proc, ipfs, dir)
}

class RemoteRunningIpfs {
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

  async shutdown(): Promise<void> {
    // We do not want to shutdown a remote server as we do not control its lifecycle.
    // Therefore this is a noop call.
  }
}

async function remote(host?: string, port?: number): Promise<RunningIpfs> {
  const resolvedHost = host || 'localhost'
  const resolvedPort = port || 5101
  const ipfs = createIpfsClient({
    host: resolvedHost,
    port: resolvedPort,
  })
  ipfs.config.get = async (key: string): Promise<string | object> => {
    if (key === 'Addresses.API') {
      return `https://${resolvedHost}:${resolvedPort}`
    }
    return ''
  }
  const p = new Proxy(ipfs, {
    get(target: any, p: PropertyKey): any {
      if (p === 'stop') {
        return () => undefined
      }
      return target[p]
    },
  })
  return new RemoteRunningIpfs(p)
}

export class RustIpfs {
  private readonly opts: RustIpfsOptions
  private api?: RunningIpfs

  constructor(opts: RustIpfsOptions) {
    let options = opts
    if (!opts || Object.keys(opts).length === 0) {
      options = RustIpfs.defaultOptions()
    }

    this.opts = options
  }

  static defaultOptions(): RustIpfsOptions {
    const path = process.env.CERAMIC_ONE_PATH
    if (!path) {
      throw new Error(
        'Missing rust ceramic binary path. Set CERAMIC_ONE_PATH=/path/to/binary. For example: `CERAMIC_ONE_PATH=/usr/local/bin/ceramic-one`.'
      )
    }
    let network
    switch (process.env.CERAMIC_ONE_NETWORK) {
      case 'mainnet':
        network = Networks.MAINNET
        break
      case 'testnet-clay':
        network = Networks.TESTNET_CLAY
        break
      case 'dev-unstable':
        network = Networks.DEV_UNSTABLE
        break
      case 'local':
        network = Networks.LOCAL
        break
      case 'inmemory' || 'in-memory':
        network = Networks.INMEMORY
        break
      default:
        network = Networks.INMEMORY
    }
    const storeDir = process.env.CERAMIC_ONE_STORE_DIR
    let port
    // for tests we use random ports, but we assume a real store means a real network
    if (storeDir) {
      port = 5101
    }
    return {
      path,
      type: 'binary',
      network,
      port,
      storeDir,
    }
  }

  async start(): Promise<RunningIpfs> {
    if (!this.api) {
      if (!this.opts.type) {
        throw new Error('Rust IPFS requires a type')
      }
      switch (this.opts.type) {
        case 'remote': {
          this.api = await remote(this.opts.host, this.opts.port)
          break
        }
        case 'binary': {
          this.api = await binary(
            this.opts.path,
            this.opts.network,
            this.opts.port,
            this.opts.storeDir,
            this.opts.networkId
          )
          break
        }
      }
    }

    return this.api
  }
}
