import type { IKVFactory, IKVStoreA } from './ikv-store.js'
import type { IObjectStore } from './iobject-store.js'

export abstract class ObjectStore<TKeyObject, TValue> implements IObjectStore<TKeyObject, TValue> {
  protected abstract useCaseName: string | undefined

  protected store: IKVStoreA
  private readonly generateKey: (object: TKeyObject) => string
  private readonly serialize: (value: TValue) => any
  private readonly deserialize: (serialized: any) => TValue

  private throwIfNotOpened(): void {
    if (!this.store)
      throw Error(
        `${this.constructor.name} is closed, you need to call async open(...), before performing other operations`
      )
  }

  constructor(
    generateKey: (object: TKeyObject) => string,
    serialize: (value: TValue) => any,
    deserialize: (value: any) => TValue
  ) {
    this.generateKey = generateKey
    this.serialize = serialize
    this.deserialize = deserialize
  }

  async open(factory: IKVFactory): Promise<void> {
    this.store = await factory.open(this.useCaseName)
  }

  async close(): Promise<void> {
    if (!this.store) return
    await this.store.close()
    this.store = undefined
  }

  async save(object: TKeyObject, value: TValue): Promise<void> {
    this.throwIfNotOpened()
    await this.store.put(this.generateKey(object), this.serialize(value))
  }

  async load(object: TKeyObject): Promise<TValue> {
    this.throwIfNotOpened()
    try {
      const serialized = await this.store.get(this.generateKey(object))
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

  async remove(object: TKeyObject): Promise<void> {
    this.throwIfNotOpened()
    await this.store.del(this.generateKey(object))
  }
}
