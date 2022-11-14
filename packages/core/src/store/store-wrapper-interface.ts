export type StoreSearchParams = {
  limit?: number
  subChannel? : string
}

export interface StoreWrapperInterface {
  networkName: string

  close(): Promise<void>
  isEmpty(params?: StoreSearchParams): Promise<boolean>
  find(params?: StoreSearchParams): Promise<any[]>
  put(key: string, value: any, subChannel?: string): Promise<void>
  get(key: string, subChannel?: string): Promise<any>
  del(key: string, subChannel?: string): Promise<void>
}
