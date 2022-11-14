import { StoreForNetwork } from './store-for-network.js'

export interface StoreInterface <O, V> {
  open(store: StoreForNetwork): Promise<void>
  close(): Promise<void>
  save(object: O, value: V): Promise<void>
  load(object: O): Promise<V>
  remove(object: O): Promise<void>
}
