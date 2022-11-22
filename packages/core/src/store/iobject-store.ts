import { IKVStore } from './ikv-store.js'

export interface IObjectStore<O, V> {
  open(store: IKVStore): Promise<void>
  close(): Promise<void>
  save(object: O, value: V): Promise<void>
  load(object: O): Promise<V>
  remove(object: O): Promise<void>
}
