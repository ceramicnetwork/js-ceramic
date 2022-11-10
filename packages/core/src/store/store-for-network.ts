export type StoreSearchParams = {
  all?: string
  limit?: number
}

export interface StoreForNetwork {
  networkName: string

  init(): Promise<void>
  close(): Promise<void>
  isEmpty(params?: StoreSearchParams): Promise<boolean>
  find(params?: StoreSearchParams): Promise<string[]>
  put(key: string, value: string): Promise<void>
  get(key: string): Promise<string>
  del(key: string): Promise<void>
}
