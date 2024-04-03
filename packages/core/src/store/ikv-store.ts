export type StoreSearchParams = {
  reverse: boolean
  limit: number
  gte: string
  lte: string
  gt: string
  lt: string
}

export type IKVStoreFindResult = {
  key: string
  value: any
}

export interface ChainedKVBatch {
  put(key: string, value: string): this
  del(key: string): this
  clear(): this
  write(): Promise<void>
}

export interface IKVStore {
  close(): Promise<void>
  isEmpty(params?: Partial<StoreSearchParams>): Promise<boolean>
  findKeys(params?: Partial<StoreSearchParams>): Promise<Array<string>>
  find(params?: Partial<StoreSearchParams>): Promise<Array<IKVStoreFindResult>>
  exists(key: string): Promise<boolean>
  put(key: string, value: any): Promise<void>
  get(key: string): Promise<any>
  del(key: string): Promise<void>
  batch(): ChainedKVBatch
}

export interface IKVFactory {
  open(name?: string): Promise<IKVStore>
  close(): Promise<void>
}
