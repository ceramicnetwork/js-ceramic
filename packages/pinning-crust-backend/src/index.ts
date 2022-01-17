import type CID from 'cids'
import type { CidList, PinningBackend, PinningInfo } from '@ceramicnetwork/common'
import { Keyring } from '@polkadot/keyring'
import { KeyringPair } from '@polkadot/keyring/types'
import { ApiPromise, WsProvider } from '@polkadot/api';
import { typesBundleForPolkadot } from '@crustio/type-definitions';

// Errors
export class EmptySeedError extends Error {
  constructor(address: string) {
    super(`[Crust]: No seed provided at ${address}`)
  }
}

export class PlaceOrderError extends Error {
  constructor(type: number) {
    super(`[Crust]: Place storage order (${type}) failed.`)
  }
}

export class AddPrepaidError extends Error {
  constructor(type: number) {
    super(`[Crust]: Add prepaid (${type}) failed.`)
  }
}

// Pinning class
export class CrustPinningBackend implements PinningBackend {
  static designator = 'crust'

  readonly id: string
  readonly endpoint: string
  readonly seed: string
  readonly keyPair: KeyringPair

  api: ApiPromise

  constructor(readonly connectionString: string) {
    // Check input
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

    // Get a onchain keypair
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
    // Do nothing
  }

  async pin(cid: CID): Promise<void> {
    // Check connnetion
    await this.api.isReadyOrError

    // Support for the storage of up to 32G
    const tx = this.api.tx.market.placeStorageOrder(cid.toString(), 32 * 1024 * 1024 * 1024, 0, '')
    await tx.signAndSend(this.keyPair, ({ events = [], status }) => {
      if (status.isInBlock) {
        events.forEach(({ event: { method, section } }) => {
          if (section === 'system' && method === 'ExtrinsicFailed') {
            throw new PlaceOrderError(tx.type)
          }
        });
      }
    }).catch(e => {
      throw e
    });

    // Permanent storage
    // Learn what's prepard for: https://wiki.crust.network/docs/en/DSM#3-file-order-assurance-settlement-and-discount
    const prepard = 10000000; // in pCRU, 1 pCRU = 10^-12 CRU
    const tx2 = this.api.tx.market.addPrepaid(cid.toString(), prepard);
    tx2.signAndSend(this.keyPair, ({ events = [], status }) => {
      if (status.isInBlock) {
        events.forEach(({ event: { method, section } }) => {
          if (section === 'system' && method === 'ExtrinsicFailed') {
            throw new AddPrepaidError(tx2.type)
          }
        });
      }
    }).catch(e => {
      throw e
    })
  }

  async unpin(cid: CID): Promise<void> {
    // do nothing
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
