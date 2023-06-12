import { CID } from 'multiformats/cid'
import { base36 } from 'multiformats/bases/base36'
import { hash as sha256 } from '@stablelib/sha256';
import varint from 'varint'
import * as cbor from 'cborg'
import * as u8a from 'uint8arrays'
import { STREAMID_CODEC } from './constants.js'
import { Memoize } from 'mapmoize'

const TAG = Symbol.for('@ceramicnetwork/streamid/EventID')

const DAG_CBOR_CODEC = 0x30
const STREAMID_CODEC_LEN = 2
const DAG_CBOR_CODEC_LEN = 1

const NETWORK: Record<string, number> = {
  "mainnet":	0x00,
  "testnet-clay":	0x01,
  "dev-unstable":	0x02,
  "inmemory":	0xFF
}

function networkByName(net: string):number {
  const netId = NETWORK[net]
  if (!netId && netId !== 0) throw new Error('Not a valid network name')
  return netId
}

export class EventID {
  protected readonly _tag = TAG

  private readonly _networkID: number
  private readonly _separator: Uint8Array
  private readonly _controller: Uint8Array
  private readonly _init: Uint8Array
  private readonly _eventHeight: number
  private readonly _event: CID

  // WORKARDOUND Weird replacement for Symbol.hasInstance due to
  // this old bug in Babel https://github.com/babel/babel/issues/4452
  // which is used by CRA, which is widely popular.
  static isInstance(instance: any): instance is EventID {
    return typeof instance === 'object' && '_tag' in instance && instance._tag === TAG
  }

  /**
   * Create a new EventID.
   */
  constructor(networkID: number, separator: Uint8Array, controller: Uint8Array, init: Uint8Array, eventHeight: number, event: CID) {
    this._networkID = networkID
    this._separator = separator
    this._controller = controller
    this._init = init
    this._eventHeight = eventHeight
    this._event = event
  }

  /**
   * Create a new EventID.
   */
  static create(networkID: number | string, separator: string, controller: string, init: CID | string, eventHeight: number, event: CID | string ): EventID {
    const networkIDInt = typeof networkID === 'string' ? networkByName(networkID) : networkID
    const separatorBytes = sha256(u8a.fromString(separator)).slice(-8)
    const controllerBytes = sha256(u8a.fromString(controller)).slice(-8)
    const initCid = typeof init === 'string' ? CID.parse(init) : init
    const initBytes = initCid.bytes.slice(-4)
    const eventCid = typeof event === 'string' ? CID.parse(event) : event
    return new EventID(networkIDInt, separatorBytes, controllerBytes, initBytes, eventHeight, eventCid)
  }

  /**
   * Bytes representation of EventID.
   */
  @Memoize()
  get bytes(): Uint8Array {
    const streamCodec = varint.encode(STREAMID_CODEC)
    const dagcborCodec = varint.encode(DAG_CBOR_CODEC)
    const networkID = varint.encode(this._networkID)
    const eventHeight = cbor.encode(this._eventHeight)
    const event = this._event.bytes
    return u8a.concat([streamCodec, dagcborCodec, networkID, this._separator, this._controller, this._init, eventHeight, event])
  }

  /**
   * EventID instance from bytes
   */
  static fromBytes(bytes: Uint8Array): EventID {
    try {
      const netOffset = STREAMID_CODEC_LEN + DAG_CBOR_CODEC_LEN
      const networkID = varint.decode(bytes, netOffset)
      const sepOffset = varint.decode.bytes + netOffset
      const seperator = bytes.slice(sepOffset, sepOffset + 8)
      const conOffset = sepOffset + 8 
      const controller = bytes.slice(conOffset, conOffset + 8)
      const initOffest = conOffset + 8 
      const init = bytes.slice(initOffest, initOffest + 4)
      const ehOffset = initOffest + 4 
      const remaining = bytes.slice(ehOffset)
      const eventHeight = cbor.decode(bytes.slice(ehOffset, ehOffset + remaining.length - 36))
      const event = CID.decode(remaining.slice(remaining.length - 36))
      return new EventID(networkID, seperator, controller, init, eventHeight, event)
    } catch(e) {
      throw new Error(`Invalid EventID: ${(e as Error).message}`)
    }
  }
 
  /**
   * EventID instance from base36 string
   */
  static fromString(str: string): EventID {
    const bytes = base36.decode(str)
    return this.fromBytes(bytes)
  }

  /**
   * Encode the EventID into a string.
   */
  @Memoize()
  toString(): string {
    return base36.encode(this.bytes)
  }
  
  /**
   * Compare equality with another EventID.
   */
  equals(other: EventID): boolean {
    if (EventID.isInstance(other)) {
      return this._networkID === other._networkID &&
      u8a.equals(this._separator, other._separator) &&
      u8a.equals(this._controller, other._controller) &&
      u8a.equals(this._init, other._init) &&
      this._eventHeight === other._eventHeight &&
      this._event.equals(other._event)
    } else {
      return false
    }
  }

  /**
   * Encode the EventID into a base36 url.
   */
  @Memoize()
  toUrl(): string {
    return `ceramic://${this.toString()}`
  }

  /**
   * EventID network id 
   */
  get networkID(): number {
    return this._networkID
  }

  /**
   * Seperator Bytes (8)
   */
  get separator(): Uint8Array {
    return this._separator
  }

  /**
   * Controller Bytes (8)
   */
  get controller(): Uint8Array {
    return this._controller
  }

  /**
   *  Init CID last 4 bytes (8)
   */
  get init(): Uint8Array {
    return this._controller
  }

  /**
   *  Event Height
   */
  get eventHeight(): number {
    return this._eventHeight
  }

  /**
   *  Event CID
   */
  get event(): CID {
    return this._event
  }

  /**
   * EventId(knbm43eudivgnrlswgh1oqxfn5hs26elo8676fjdaenhwd4izj5rarfghhgxw1vuhundzpcng2v0ks23kztn105ba7bpg10na)
   */
  [Symbol.for('nodejs.util.inspect.custom')](): string {
    return `EventID(${this.toString()})`
  }

  /**
   * String representation of EventID.
   */
  [Symbol.toPrimitive](): string {
    return this.toString()
  }
}
