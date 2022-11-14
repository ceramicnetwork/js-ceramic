import { StoreWrapperInterface } from './store-wrapper-interface.js'
import { StoreInterface } from './store-interface.js'

export abstract class AbstractStore<O, V> implements StoreInterface<O, V> {
  storeSubChannel: string | undefined
  store: StoreWrapperInterface

  private throwIfNotOpened(): void {
    if (!this.store) throw Error('Anchor Request Store is closed, you need to call async open(), before performing other operations')
  }

  abstract getKey(object: O): string

  abstract serialize(value: V): any

  abstract deserialize(value: any): V

  async open(store: StoreWrapperInterface): Promise<void> {
    this.store = store
  }

  async close(): Promise<void> {
    this.throwIfNotOpened()
    await this.store.close()
    this.store = undefined
  }

  async save(object: O, value: V): Promise<void> {
    this.throwIfNotOpened()
    await this.store.put(
      this.getKey(object),
      this.serialize(value),
      this.storeSubChannel
    )
  }

  async load(object: O): Promise<V> {
    this.throwIfNotOpened()
    try {
      const serialized = await this.store.get(
        this.getKey(object)
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

  async remove(object: O): Promise<void> {
    this.throwIfNotOpened()
    await this.store.del(
      this.getKey(object),
      this.storeSubChannel
    )
  }
}
