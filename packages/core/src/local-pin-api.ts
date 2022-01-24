import { PinApi, PublishOpts, SyncOptions } from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'
import { DiagnosticsLogger } from '@ceramicnetwork/common'
import { Repository } from './state-management/repository.js'

/**
 * PinApi for Ceramic core.
 */
export class LocalPinApi implements PinApi {
  constructor(
    private readonly repository: Repository,
    private readonly logger: DiagnosticsLogger
  ) {}

  async add(streamId: StreamID, force?: boolean): Promise<void> {
    const state$ = await this.repository.load(streamId, { sync: SyncOptions.PREFER_CACHE })
    await this.repository.pin(state$, force)
    this.logger.verbose(`Pinned stream ${streamId.toString()}`)
  }

  async rm(streamId: StreamID, opts?: PublishOpts): Promise<void> {
    const state$ = await this.repository.get(streamId)
    if (!state$) {
      this.logger.verbose(`Cannot unpin stream ${streamId.toString()} as it isn't pinned`)
      return
    }
    await this.repository.unpin(state$, opts)
    this.logger.verbose(`Unpinned stream ${streamId.toString()}`)
  }

  async ls(streamId?: StreamID): Promise<AsyncIterable<string>> {
    const streamIds = await this.repository.listPinned(streamId ? streamId.baseID : null)
    return {
      [Symbol.asyncIterator](): any {
        let index = 0
        return {
          next(): any {
            if (index === streamIds.length) {
              return Promise.resolve({ value: null, done: true })
            }
            return Promise.resolve({ value: streamIds[index++], done: false })
          },
        }
      },
    }
  }
}
