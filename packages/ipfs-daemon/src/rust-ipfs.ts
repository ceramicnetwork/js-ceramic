import Dockerode from 'dockerode'
import { Container } from 'dockerode'
import type { IpfsApi } from '@ceramicnetwork/common'
import { create as createIpfsClient } from 'ipfs-http-client'
import { RunningIpfs } from './create-ipfs.js'
import * as stream from 'stream'
import { DiagnosticsLogger } from '@ceramicnetwork/common'

export type RustIpfsEmbeddedOptions = {
  type: 'embedded'
  image: string | undefined
  port: number | undefined
}

export type RustIpfsRemoteOptions = {
  type: 'remote'
  host: string | undefined
  port: number | undefined
}

export type RustIpfsOptions = RustIpfsEmbeddedOptions | RustIpfsRemoteOptions

class EmbeddedRunningIpfs implements RunningIpfs {
  private readonly _api: IpfsApi
  private readonly container: Container

  constructor(container: Container, api: IpfsApi) {
    this.container = container
    this._api = api
  }

  api(): IpfsApi {
    return this._api
  }

  async shutdown(logger?: DiagnosticsLogger): Promise<void> {
    try {
      await this.container.stop()
    } catch (e) {
      if (logger) {
        logger.err(`Failed to shutdown embedded Rust IPFS: ${e}`)
      }
    }
  }
}

async function embedded(image?: string, port?: number): Promise<RunningIpfs> {
  const docker = new Dockerode()

  const logStream = new stream.PassThrough()
  logStream.on('data', function (chunk) {
    console.log(chunk.toString('utf8'))
  })

  const resolvedImage = image || 'public.ecr.aws/r5b3e0r5/3box/ceramic-one:latest'
  const resolvedPort = port || 5001
  const dockerPort = `${resolvedPort}/tcp`
  const container = await new Promise((resolve, reject) => {
    docker.createContainer(
      {
        Image: resolvedImage,
        Name: 'rust-ceramic',
        AttachStdout: true,
        AttachStderr: true,
        AttachStdin: false,
        OpenStdin: false,
        StdinOnce: false,
        HostConfig: {
          AutoRemove: true,
          PortBindings: {
            [dockerPort]: [{ HostPort: `${resolvedPort}` }],
          },
        },
        // Cmd: [`--bind-address "0.0.0.0:${resolvedPort}"`],
        ENV: [`CERAMIC_ONE_BIND_ADDRESS=0.0.0.0:${resolvedPort}`],
        ExposedPorts: { [dockerPort]: {} },
      },
      function (err, cont) {
        if (err) {
          reject(err)
        } else {
          cont.start({}, function (err, data) {
            if (err) {
              reject(err)
            } else {
              resolve(cont)
            }
          })
        }
      }
    )
  })

  const ipfs = await createIpfsClient({
    host: 'localhost',
    port: port,
  })

  let ipfsOnline = false
  while (!ipfsOnline) {
    try {
      // if(containerFailed) {
      //   throw new Error('Container failed to start')
      // }
      await ipfs.id()
      ipfsOnline = true
    } catch (e) {
      await new Promise((f) => setTimeout(f, 1000))
    }
  }
  return new EmbeddedRunningIpfs(container, ipfs)
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
    //no additional shutdown required
    //calling api.stop() would attempt to shutdown the remote server
  }
}

async function remote(host?: string, port?: number): Promise<RunningIpfs> {
  const resolvedHost = host || 'localhost'
  const resolvedPort = port || 5001
  const ipfs = await createIpfsClient({
    host: resolvedHost,
    port: resolvedPort,
  })
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
        case 'embedded': {
          this.api = await embedded(this.opts.image, this.opts.port)
          break
        }
      }
    }

    return this.api
  }
}
