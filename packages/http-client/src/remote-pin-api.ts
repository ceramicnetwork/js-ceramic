import { fetchJson, PinApi } from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'
import { PublishOpts } from '@ceramicnetwork/common'

/**
 * PinApi for Ceramic HTTP client
 */
export class RemotePinApi implements PinApi {
  constructor(private readonly _apiUrl: string) {}

  async add(streamId: StreamID): Promise<void> {
    await fetchJson(this._apiUrl + '/pins' + `/${streamId.toString()}`, { method: 'post' })
  }

  async rm(streamId: StreamID, opts?: PublishOpts): Promise<void> {
    await fetchJson(this._apiUrl + '/pins' + `/${streamId.toString()}`, {
      method: 'delete',
      body: { opts },
    })
  }

  async ls(streamId?: StreamID): Promise<AsyncIterable<string>> {
    let url = this._apiUrl + '/pins'
    if (streamId) {
      url += `/${streamId.toString()}`
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
