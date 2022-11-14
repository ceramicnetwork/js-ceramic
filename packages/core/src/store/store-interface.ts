import { StoreForNetwork } from './store-for-network.js'

export interface StoreInterface <K, V> {
  open(store: StoreForNetwork): Promise<void>
  close(): Promise<void>
  save(key: K, value: V): Promise<void>
  load(key: K): Promise<V>
  remove(key: K): Promise<void>
}
