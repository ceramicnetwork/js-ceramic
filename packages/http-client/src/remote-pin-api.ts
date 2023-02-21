import { fetchJson, PinApi } from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'
import { PublishOpts } from '@ceramicnetwork/common'
import { DID } from 'dids'
import { MissingDIDError } from './utils.js'

/**
 * PinApi for Ceramic HTTP client
 */
export class RemotePinApi implements PinApi {
  // Stored as a member to make it easier to inject a mock in unit tests
  private readonly _fetchJson: typeof fetchJson = fetchJson

  constructor(private readonly _apiUrl: URL, private readonly _getDidFn: () => DID) {}

  private async buildJWS(actingDid: DID, code: string, url: URL): Promise<string> {
    if (!actingDid) throw new MissingDIDError()
    const jws = await actingDid.createJWS({
      code: code,
      requestPath: url.pathname,
    })
    return `${jws.signatures[0].protected}.${jws.payload}.${jws.signatures[0].signature}`
  }

  readonly getCodePath = './admin/getCode'

  private getCodeUrl(): URL {
    return new URL(this.getCodePath, this._apiUrl)
  }

  private async generateCode(): Promise<string> {
    return (await this._fetchJson(this.getCodeUrl())).code
  }

  async add(streamId: StreamID, force?: boolean): Promise<void> {
    const args: any = {}
    if (force) {
      args.force = true
    }
    const code = await this.generateCode()
    const url = new URL(`./admin/pins/${streamId}`, this._apiUrl)
    await this._fetchJson(url, {
      headers: { Authorization: `Basic ${await this.buildJWS(this._getDidFn(), code, url)}` },
      method: 'post',
      body: args,
    })
  }

  async rm(streamId: StreamID, opts?: PublishOpts): Promise<void> {
    const code = await this.generateCode()
    const url = new URL(`./admin/pins/${streamId}`, this._apiUrl)
    await this._fetchJson(url, {
      headers: { Authorization: `Basic ${await this.buildJWS(this._getDidFn(), code, url)}` },
      method: 'delete',
      body: { opts },
    })
  }

  async ls(streamId?: StreamID): Promise<AsyncIterable<string>> {
    let url = new URL('./admin/pins', this._apiUrl)
    if (streamId) {
      url = new URL(`./admin/pins/${streamId.toString()}`, this._apiUrl)
    }
    const code = await this.generateCode()
    const result = await this._fetchJson(url, {
      headers: { Authorization: `Basic ${await this.buildJWS(this._getDidFn(), code, url)}` },
    })
    const { pinnedStreamIds } = result
    return {
      [Symbol.asyncIterator](): AsyncIterator<string, any, undefined> {
        let index = 0
        return {
          next(): Promise<IteratorResult<string>> {
            if (index === pinnedStreamIds.length) {
              return Promise.resolve({ value: null, done: true })
            }
            return Promise.resolve({ value: pinnedStreamIds[index++], done: false })
          },
        }
      },
    }
  }
}
