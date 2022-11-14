import { AnchorRequestData, AnchorRequestStoreInterface } from './anchor-request-store-interface.js'
import { CommitID, StreamID } from '@ceramicnetwork/streamid'
import { StoreForNetwork } from './store-for-network.js'
import { DiagnosticsLogger } from '@ceramicnetwork/common'

export class AnchorRequestStore implements AnchorRequestStoreInterface {
  networkName: string
  #storeSubChannel = 'anchor-requests'
  #logger: DiagnosticsLogger
  #store: StoreForNetwork

  constructor(logger: DiagnosticsLogger) {
    this.#logger = logger
  }

  private throwIfNotOpened(): void {
    if (!this.#store) throw Error('Anchor Request Store is closed, you need to call async open(), before performing other operations')
  }

  private getFullKey(commitID: CommitID): string {
    return commitID.toString()
  }

  private serialize(data: AnchorRequestData): string {
    return JSON.stringify(data)
  }

  private deserialize(serialized: string): AnchorRequestData {
    return JSON.parse(serialized)
  }

  async open(store: StoreForNetwork): Promise<void> {
    this.#store = store
    await this.#store.init()
  }

  async save(commitID: CommitID, data: AnchorRequestData): Promise<void> {
    this.throwIfNotOpened()
    await this.#store.put(
      this.getFullKey(commitID),
      this.serialize(data),
      this.#storeSubChannel
    )
  }

  async load(commitID: CommitID): Promise<AnchorRequestData> {
    this.throwIfNotOpened()
    try {
      const serialized = await this.#store.get(
        this.getFullKey(commitID)
      )
      if (serialized) {
        return this.deserialize(serialized)
      } else {
        return null
      }
    } catch (err) {
      if (err.notFound) {
        return null // return null for non-existent entry
      }
      throw err
    }
  }

  async remove(commitID: CommitID): Promise<void> {
    this.throwIfNotOpened()
    await this.#store.del(
      this.getFullKey(commitID),
      this.#storeSubChannel
    )
  }

  async close(): Promise<void> {
    this.throwIfNotOpened()
    await this.#store.close()
    this.#store = undefined
  }
}
