import { StoreWrapperInterface } from './store-wrapper-interface.js'

export interface StoreInterface <O, V> {
  open(store: StoreWrapperInterface): Promise<void>
  close(): Promise<void>
  save(object: O, value: V): Promise<void>
  load(object: O): Promise<V>
  remove(object: O): Promise<void>
}
