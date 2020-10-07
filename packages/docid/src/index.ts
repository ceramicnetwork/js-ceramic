import CID from 'cids'
const multibase = require('multibase')
const subnets = require('./subnet-table.json')
const doctypes = require('./doctype-table.json')
const varint = require('varint')
const uint8ArrayConcat = require('uint8arrays/concat')
const uint8ArrayToString = require('uint8arrays/to-string')
const uint8ArrayEquals = require('uint8arrays/equals')
const DOCID_CODEC = 206

const getKey = (obj: { [key: string]: number; }, value: number): string | undefined => {
  for (const [k, v] of Object.entries(obj)) { 
    if (v === value) return k
  }
} 

// Definition
// '<multibase-prefix><multicodec-docid><subnet><doctype><genesis-cid-bytes>'

class DocId {
  /**
   * Create a new DocId.
   *
   * @param {string|Uint8Array}  doctype
   * @param {CID|string}         [cid]
   * @param {string}             [subnet = 'devnet']
   * @param {string}             [multibaseName = 'base36']
   *
   * @example
   * new DocId(<docType>, <CID>|<cidStr>)
   * new DocId(<docType>, <CID>|<cidStr>, <subnet>, <multibaseName>)
   */

  private _docType: number 
  private _subnet: number
  private _cid: CID
  private _multibaseName: string

  constructor (doctype: string | number = 'tile', cid: CID | string, subnet: string | number = 'devnet', multibaseName: string = 'base36') {
    this._docType = (typeof cid === 'string') ? doctypes[doctype] : doctype
     // if (!doctype) throw new Error('constructor: doctype required')
    this._subnet = (typeof cid === 'string')? subnets[subnet] : subnet
    this._multibaseName = multibaseName 
    this._cid = (typeof cid === 'string') ? new CID(cid) : cid
      // if (!cid) throw new Error('constructor: cid required')
  }

  static fromBytes(bytes: Uint8Array, multibaseName: string): DocId {
    const subnet = varint.decode(bytes)
    bytes = bytes.slice(varint.decode.bytes) 
    const docType = varint.decode(bytes)
    bytes = bytes.slice(varint.decode.bytes) 
    const cid = new CID(bytes)
    return new DocId(docType, cid, subnet, multibaseName)
  }

  static fromString(docId: string): DocId {
    const multibaseName = multibase.isEncoded(docId)
    const bytes = multibase.decode(docId).slice(2)
    return DocId.fromBytes(bytes, multibaseName)
  }

  /**
   * Get doc type code
   *
   * @returns {number}
   * @readonly
   */
  get docType (): number {
    return this._docType
  }

  /**
   * Get doc type name
   *
   * @returns {string}
   * @readonly
   */
  get docTypeName (): string {
    const name = getKey(doctypes, this._docType)
    if (!name) throw new Error('docTypeName: no registered name available')
    return name 
  }

  /**
   * Get CID
   *
   * @returns {CID}
   * @readonly
   */
  get cid (): CID {
    return this._cid
  }

  /**
   * Get subnet code
   *
   * @returns {number}
   * @readonly
   */
  get subnet (): number {
    return this._subnet
  }

  /**
   * Get subnet name 
   *
   * @returns {string}
   * @readonly
   */
  get subnetName (): string {
    const name = getKey(doctypes, this._subnet)
    if (!name) throw new Error('subnetName: no registered name available')
    return name 
  }

  /**
   * Get multibase name string
   *
   * @returns {string}
   * @readonly
   */
  get multibaseName (): string {
    return this._multibaseName
  }

   /**
   * Get multihash bytes of DocId
   *
   * @returns {Uint8Array}
   * @readonly
   */
  get multihash (): Uint8Array {
    return this._cid.multihash
  }

   /**
   * Get CID codec name string
   *
   * @returns {string}
   * @readonly
   */
  get codec (): string {
    return this._cid.codec
  }

  /**
   * Get bytes of DocId
   *
   * @returns {Uint8Array}
   * @readonly
   */
  get bytes (): Uint8Array {
    const codec = varint.encode(DOCID_CODEC)
    const subnet = varint.encode(this._subnet)
    const doctype = varint.encode(this._docType)
    return uint8ArrayConcat([
      codec, subnet, doctype, this._cid.bytes
    ])
  }


 /**
   * Compare equality with another DocId.
   *
   * @param   {DocId}   other
   * @returns {bool}
   */
  equals(other: DocId | Uint8Array | string): boolean {
    // same cid 
    // same doctype
    // maybe ignore subnet
    return true
  }

  /**
   * Encode the DocId into a string.
   *
   * @param   {string}   [base=this.multibaseName]   Base encoding to use.
   * @returns {string}
   */
  toBaseEncodedString (base: string = this.multibaseName): string {
    return uint8ArrayToString(multibase.encode(base, this.bytes))
  }

  /**
   * Encode the DocId into a string.
   *
   * @param   {string}   [base=this.multibaseName]   Base encoding to use.
   * @returns {string}
   */
  toString(base: string): string {
    return this.toBaseEncodedString(base)
  }
    /**
   * Determine if given DocId, DocId string or bytes is a valid DocId
   *
   * @param   {any}     other
   * @returns {bool}
   */
  static isDocId (other: DocId | Uint8Array | string): boolean {
    // just try taking all parts 
    // confirm docid codec 
    // confirm cid 
    // cacth return false
    return true
  }
}

module.exports = DocId