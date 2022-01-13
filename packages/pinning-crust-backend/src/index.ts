import type CID from 'cids'
import type { CidList, PinningBackend, PinningInfo } from '@ceramicnetwork/common'
import { Keyring } from '@polkadot/keyring'
import { KeyringPair } from '@polkadot/keyring/types'
import { ApiPromise, WsProvider } from '@polkadot/api';
import { typesBundleForPolkadot } from '@crustio/type-definitions';

export class EmptySeedError extends Error {
  constructor(address: string) {
    super(`No seed provided for crust gateway at ${address}`)
  }
}

export class CrustPinningBackend implements PinningBackend {
  static designator = 'crust'

  readonly id: string
  readonly endpoint: string
  readonly seed: string
  readonly keyPair: KeyringPair

  api: ApiPromise
  
  constructor(readonly connectionString: string) {
    // 1.1 check input
    const url = new URL(connectionString)
    const hostname = url.hostname
    const seed = url.searchParams.get('seed')
    if (!seed) {
      throw new EmptySeedError(this.endpoint)
    }
    this.seed = seed

    const protocol = url.protocol
      .replace('crust:', 'ws')
      .replace('crust+ws:', 'ws')
      .replace('crust+wss:', 'wss')

    if (url.port) {
      this.endpoint = `${protocol}://${hostname}:${url.port}`
    } else {
      this.endpoint = `${protocol}://${hostname}`
    }

    // 1.2 get a keypair
    const keyring = new Keyring();
    this.keyPair = keyring.addFromUri(seed as string);
  }

  open(): void {
    this.api = new ApiPromise({
      provider: new WsProvider(this.endpoint),
      typesBundle: typesBundleForPolkadot,
    });
  }

  async close(): Promise<void> {
    // Do Nothing
  }

  async pin(cid: CID): Promise<void> {
  }

  async unpin(cid: CID): Promise<void> {
  }

  async ls(): Promise<CidList> {
    return {}
  }

  async info(): Promise<PinningInfo> {
    return {
      [this.id]: {},
    }
  }
}
