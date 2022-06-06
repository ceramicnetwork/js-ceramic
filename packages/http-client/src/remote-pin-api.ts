import { fetchJson, PinApi } from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'
import { PublishOpts } from '@ceramicnetwork/common'

/**
 * PinApi for Ceramic HTTP client
 */
export class RemotePinApi implements PinApi {
  constructor(private readonly _apiUrl: URL) {}

  async add(streamId: StreamID, force?: boolean): Promise<void> {
    const args: any = {}
    if (force) {
      args.force = true
    }
    const url = new URL(`./pins/${streamId}`, this._apiUrl)
    await fetchJson(url, {
      method: 'post',
      body: args,
    })
  }

  async rm(streamId: StreamID, opts?: PublishOpts): Promise<void> {
    const url = new URL(`./pins/${streamId}`, this._apiUrl)
    await fetchJson(url, {
      method: 'delete',
      body: { opts },
    })
  }

  async ls(streamId?: StreamID): Promise<AsyncIterable<string>> {
    let url = new URL('./pins', this._apiUrl)
    if (streamId) {
      url = new URL(`./pins/${streamId.toString()}`, this._apiUrl)
    }
    const result = await fetchJson(url)
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
