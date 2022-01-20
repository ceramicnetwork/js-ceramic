import type CID from 'cids'
import type { CidList, PinningBackend, PinningInfo } from '@ceramicnetwork/common'
import { Keyring } from '@polkadot/keyring'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { typesBundleForPolkadot } from '@crustio/type-definitions'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import * as sha256 from '@stablelib/sha256'
import * as base64 from '@stablelib/base64'
import { KeyringPair } from '@polkadot/keyring/types';
import { DispatchError } from '@polkadot/types/interfaces';
import { ITuple } from '@polkadot/types/types';
import { SubmittableExtrinsic } from '@polkadot/api/promise/types';

// Encoder
const textEncoder = new TextEncoder()

// Errors
export class EmptySeedError extends Error {
  constructor(address: string) {
    super(`[Crust]: No seed provided at ${address}`)
  }
}

export class TxError extends Error {
  constructor(type: number, msg: string) {
    super(`[Crust]: Send transaction(${type}) failed with ${msg}`)
  }
}

// Object
interface ListRes {
  data: {
    substrate_extrinsic: Array<{ args: string }>
  }
}

// Pinning class
export class CrustPinningBackend implements PinningBackend {
  static designator = 'crust'

  readonly id: string
  readonly endpoint: string
  readonly seed: string
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

    // ID
    const bytes = textEncoder.encode(this.connectionString)
    const digest = base64.encodeURLSafe(sha256.hash(bytes))
    this.id = `${CrustPinningBackend.designator}@${digest}`
  }

  open(): void {
    this.api = new ApiPromise({
      provider: new WsProvider(this.endpoint),
      typesBundle: typesBundleForPolkadot,
    });
  }

  async close(): Promise<void> {
    if (this.api) {
      await this.api.disconnect()
      this.api = undefined
    }
  }

  async pin(cid: CID): Promise<void> {
    // Check connnetion
    if (!this.api) {
      return
    }
    await this.api.isReadyOrError

    // Get a onchain keypair
    const kr = new Keyring({ type: 'sr25519', ss58Format: 66 })
    const krp = kr.addFromUri(this.seed)

    // Storage order
    // Support for the storage of up to 30G
    const size = 30 * 1024 * 1024 * 1024
    const tx = this.api.tx.market.placeStorageOrder(cid.toString(), size, 0, '')
    await this.sendTx(tx, krp)

    // Permanent storage
    // Learn what's prepard for: https://wiki.crust.network/docs/en/DSM#3-file-order-assurance-settlement-and-discount
    // In pCRU, 1 pCRU = 10^-12 CRU
    const prepard = 1000000000 // in pCRU, 1 pCRU = 10^-12 CRU
    const tx2 = this.api.tx.market.addPrepaid(cid.toString(), prepard)
    await this.sendTx(tx2, krp)
  }

  async unpin(cid: CID): Promise<void> {
    // Do nothing
  }

  async ls(): Promise<CidList> {
    // Check connnetion
    if (!this.api) {
      return {}
    }
    await this.api.isReadyOrError

    // Get a onchain keypair
    const kr = new Keyring({ type: 'sr25519', ss58Format: 66 })
    const krp = kr.addFromUri(this.seed)
    const data = '{"query": "query MyQuery {\\n  substrate_extrinsic(where: {method: {_eq: \\"placeStorageOrder\\"}, blockNumber: {}, signer: {_eq: \\"' + krp.address + '\\"}}, order_by: {blockNumber: desc}) {\\n    args(path: \\".[0].value\\")\\n  }\\n}\\n"}';

    // Request
    const result: CidList = {}
    const tryTimes = 3
    for (let i = 0; i < tryTimes; i++) {
      try {
        const res: AxiosResponse = await axios.post('https://crust.indexer.gc.subsquid.io/v4/graphql/', data)
        if (res && res.status == 200) {
          const resobj: ListRes = JSON.parse(JSON.stringify(res.data))
          resobj.data.substrate_extrinsic.forEach(element => {
            result[this.hex2a(element.args)] = [this.id]
          })
          break
        }
      } catch (error) {
        if (i == tryTimes - 1) {
          throw error
        }
      }

      await this.delay(6000)
    }
    return result
  }

  async info(): Promise<PinningInfo> {
    return {
      [this.id]: {},
    }
  }

  hex2a(hex: string): string {
    var str = '';
    for (var i = 2; i < hex.length; i += 2)
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
  }

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async sendTx(tx: SubmittableExtrinsic, krp: KeyringPair) {
    return new Promise((resolve, reject) => {
      tx.signAndSend(krp, ({ events = [], status }) => {
        console.log(
          `  ↪ 💸 [tx]: Transaction status: ${status.type}, nonce: ${tx.nonce}`
        )

        if (status.isInvalid || status.isDropped || status.isUsurped) {
          reject(new Error(`${status.type} transaction.`))
        } else {
          // Pass it
        }

        if (status.isInBlock) {
          events.forEach(({ event: { data, method, section } }) => {
            if (section === 'system' && method === 'ExtrinsicFailed') {
              const [dispatchError] = data as unknown as ITuple<[DispatchError]>;
              console.log(
                `  ↪ 💸 ❌ [tx]: Send transaction(${tx.type}) failed with ${dispatchError.type}.`
              );
              reject(new TxError(tx.type, dispatchError.type));
            } else if (method === 'ExtrinsicSuccess') {
              console.log(
                `  ↪ 💸 ✅ [tx]: Send transaction(${tx.type}) success.`
              );
              resolve(tx.type)
            }
          });
        } else {
          // Pass it
        }
      }).catch(e => {
        reject(e);
      })
    });
  }
}
