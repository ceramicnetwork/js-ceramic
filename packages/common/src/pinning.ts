import type { CID } from 'multiformats/cid'
import type { IpfsApi } from './index.js'

export interface PinningBackend {
  id: string

  open(): void

  close(): Promise<void>

  pin(cid: CID): Promise<void>

  unpin(cid: CID): Promise<void>

  ls(): Promise<CidList>

  info(): Promise<PinningInfo>
}

export interface PinningBackendStatic {
  designator: string

  new (connectionString: string, ipfs: IpfsApi): PinningBackend
}

export type CidString = string
export type Designator = string
export type CidList = Record<CidString, Designator[]>

export type PinningInfo = Record<string, any>
