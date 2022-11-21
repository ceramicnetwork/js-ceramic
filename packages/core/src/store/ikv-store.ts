export type StoreSearchParams = {
  limit?: number
  useCaseName? : string
}

export interface IKVStore {
  networkName: string

  close(useCaseName?: string): Promise<void>
  isEmpty(params?: StoreSearchParams): Promise<boolean>
  findKeys(params?: StoreSearchParams): Promise<any[]>
  put(key: string, value: any, useCaseName?: string): Promise<void>
  get(key: string, useCaseName?: string): Promise<any>
  del(key: string, useCaseName?: string): Promise<void>
}
