import { AnchorRequestData, AnchorRequestStoreInterface } from './anchor-request-store-interface.js'
import { CommitID } from '@ceramicnetwork/streamid'
import { StoreForNetwork } from './store-for-network.js'
import { DiagnosticsLogger, StreamUtils } from '@ceramicnetwork/common'

export class AnchorRequestStore implements AnchorRequestStoreInterface {
  networkName: string
  #storeSubChannel = 'anchor-requests'
  #logger: DiagnosticsLogger
  #store: StoreForNetwork

  constructor(logger: DiagnosticsLogger) {
    this.#logger = logger
  }

  async open(store: StoreForNetwork): Promise<void> {
    this.#store = store
    await this.#store.init()
  }

  async save(commitID: CommitID, data: AnchorRequestData): Promise<void> {
    if (!this.#store) throw Error('Anchor Request Store is closed, you need to call async open(), before performing other operations')
    await this.#store.put(
      this.getFullKey(stream.id.baseID),
      StreamUtils.serializeState(stream.state)
    )
  }

  async load(commitID: CommitID): Promise<AnchorRequestData> {
    return Promise.resolve(undefined);
  }

  async remove(commitID: CommitID): Promise<void> {
    return Promise.resolve(undefined);
  }

  async close(): Promise<void> {
    return Promise.resolve(undefined);
  }
}
