import { PinApi, PublishOpts, RunningStateLike } from '@ceramicnetwork/common'
import StreamID from '@ceramicnetwork/streamid'
import { DiagnosticsLogger } from '@ceramicnetwork/common'
import { Repository } from './state-management/repository'

/**
 * PinApi for Ceramic core.
 */
export class LocalPinApi implements PinApi {
  constructor(
    private readonly repository: Repository,
    private readonly logger: DiagnosticsLogger
  ) {}

  async add(streamId: StreamID): Promise<void> {
    const state$ = await this.repository.load(streamId, {})
    await this.repository.pin(state$)
    this.logger.verbose(`Pinned stream ${streamId.toString()}`)
  }

  async rm(streamId: StreamID, opts?: PublishOpts): Promise<void> {
    await this.repository.unpin(streamId, opts)
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
