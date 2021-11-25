import type { CID } from 'multiformats/cid'
import type { CidList, PinningBackend, PinningInfo } from '@ceramicnetwork/common'
import { createPow, Pow } from '@textile/powergate-client'
import * as sha256 from '@stablelib/sha256'
import * as base64 from '@stablelib/base64'

export class EmptyTokenError extends Error {
  constructor(address: string) {
    super(`No token provided for Powergate at ${address}`)
  }
}

const textEncoder = new TextEncoder()

export class PowergatePinningBackend implements PinningBackend {
  static designator = 'powergate'

  readonly endpoint: string
  readonly token: string
  readonly id: string

  #pow?: Pow

  constructor(readonly connectionString: string) {
    const url = new URL(connectionString)
    const hostname = url.hostname
    const port = parseInt(url.port, 10) || 6002
    const token = url.searchParams.get('token')
    const protocol = url.protocol
      .replace('powergate:', 'http')
      .replace('powergate+http:', 'http')
      .replace('powergate+https:', 'https')
    this.endpoint = `${protocol}://${hostname}:${port}`
    if (!token) {
      throw new EmptyTokenError(this.endpoint)
    }
    this.token = token

    const bytes = textEncoder.encode(this.connectionString)
    const digest = base64.encodeURLSafe(sha256.hash(bytes))
    this.id = `${PowergatePinningBackend.designator}@${digest}`
  }

  get pow(): Pow {
    return this.#pow
  }

  open(): void {
    this.#pow = createPow({ host: this.endpoint })
    this.#pow.setToken(this.token)
  }

  async close(): Promise<void> {
    // Do Nothing
  }

  async pin(cid: CID): Promise<void> {
    if (this.#pow) {
      try {
        await this.#pow.storageConfig.apply(cid.toString(), {
          override: true,
        })
      } catch (e) {
        if (e.message.includes('cid already pinned, consider using override flag')) {
          // Do Nothing
        } else {
          throw e
        }
      }
    }
  }

  async unpin(cid: CID): Promise<void> {
    if (this.#pow) {
      await this.#pow.storageConfig.remove(cid.toString())
    }
  }

  async ls(): Promise<CidList> {
    if (this.#pow) {
      const { storageInfoList } = await this.#pow.storageInfo.list()
      if (storageInfoList) {
        const result: CidList = {}
        storageInfoList.forEach((info) => {
          result[info.cid] = [this.id]
        })
        return result
      } else {
        return {}
      }
    } else {
      return {}
    }
  }

  async info(): Promise<PinningInfo> {
    return {
      [this.id]: {},
    }
  }
}
