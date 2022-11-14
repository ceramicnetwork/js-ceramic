export type StoreSearchParams = {
  limit?: number
  subChannel? : string
}

export interface StoreForNetwork {
  networkName: string

  close(): Promise<void>
  isEmpty(params?: StoreSearchParams): Promise<boolean>
  find(params?: StoreSearchParams): Promise<any[]>
  put(key: string, value: any): Promise<void>
  get(key: string): Promise<any>
  del(key: string): Promise<void>
}
