export type StoreSearchParams = {
  limit: number
  gt: string
}

export type IKVStoreFindResult = {
  key: string
  value: any
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
}

export interface IKVFactory {
  open(name?: string): Promise<IKVStore>
  close(): Promise<void>
}
