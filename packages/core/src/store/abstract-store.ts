import { StoreForNetwork } from './store-for-network.js'
import { StoreInterface } from './store-interface.js'

export abstract class AbstractStore<K, V> implements StoreInterface<K, V> {
  storeSubChannel: string | undefined
  store: StoreForNetwork

  private throwIfNotOpened(): void {
    if (!this.store) throw Error('Anchor Request Store is closed, you need to call async open(), before performing other operations')
  }

  abstract getFullKey(key: K): string

  abstract serialize(value: V): any

  abstract deserialize(value: any): V

  async open(store: StoreForNetwork): Promise<void> {
    this.store = store
  }

  async close(): Promise<void> {
    this.throwIfNotOpened()
    await this.store.close()
    this.store = undefined
  }

  async save(key: K, value: V): Promise<void> {
    this.throwIfNotOpened()
    await this.store.put(
      this.getFullKey(key),
      this.serialize(value),
      this.storeSubChannel
    )
  }

  async load(key: K): Promise<V> {
    this.throwIfNotOpened()
    try {
      const serialized = await this.store.get(
        this.getFullKey(key)
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

  async remove(key: K): Promise<void> {
    this.throwIfNotOpened()
    await this.store.del(
      this.getFullKey(key),
      this.storeSubChannel
    )
  }
}
