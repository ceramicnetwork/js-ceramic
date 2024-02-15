import getPort from 'get-port'
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
  host: string | undefined
  port: number | undefined
}

export type RustIpfsBinaryOptions = {
  type: 'binary'
  path?: string
  port?: number
  network?: Networks
  networkId?: number
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
  binary_path?: string,
  port?: number,
  networkName: Networks = Networks.LOCAL,
  networkId = 0
): Promise<RunningIpfs> {
  const bin = binary_path || process.env.CERAMIC_ONE_PATH

  const apiPort = port || (await getPort())
  const metricsPort = await getPort()
  const dir = await tmp.dir({ unsafeCleanup: true })

  const out = fs.openSync(path.join(dir.path, '/stdout.log'), 'a')
  const err = fs.openSync(path.join(dir.path, '/stderr.log'), 'a')

  const proc = spawn(
    bin,
    [
      'daemon',
      '--bind-address',
      `127.0.0.1:${apiPort}`,
      '--store-dir',
      dir.path,
      '--metrics-bind-address',
      `127.0.0.1:${metricsPort}`,
      // Use quic as it has fewer RTT which makes for lower latencies improving the stability of tests.
      '--swarm-addresses',
      '/ip4/0.0.0.0/udp/0/quic-v1',
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
      stdio: ['ignore', out, err],
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
  const resolvedPort = port || 5001
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
    this.opts = opts
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
            this.opts.port,
            this.opts.network,
            this.opts.networkId
          )
          break
        }
      }
    }

    return this.api
  }
}
