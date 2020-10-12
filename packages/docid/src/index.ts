import CID from 'cids'
const multibase = require('multibase')
const subnets = require('./subnet-table.json')
const doctypes = require('./doctype-table.json')
const varint = require('varint')
const uint8ArrayConcat = require('uint8arrays/concat')
const uint8ArrayToString = require('uint8arrays/to-string')
const DOCID_CODEC = 206

const getKey = (obj: { [key: string]: number }, value: number): string | undefined => {
  for (const [k, v] of Object.entries(obj)) { 
    if (v === value) return k
  }
} 

// Definition
// '<multibase-prefix><multicodec-docid><subnet><doctype><genesis-cid-bytes>'

class DocID {
  /**
   * Create a new DocID.
   *
   * @param {string|number}  doctype
   * @param {CID|string}         [cid]
   * @param {string | number}             [subnet = 'devnet']
   * @param {string}             [multibaseName = 'base36']
   *
   * @example
   * new DocID(<docType>, <CID>|<cidStr>)
   * new DocID(<docType>, <CID>|<cidStr>, <subnet>, <multibaseName>)
   */

  private _doctype: number 
  private _subnet: number
  private _cid: CID
  private _multibaseName: string
  private _bytes: Uint8Array

  constructor (doctype: string | number, cid: CID | string, subnet: string | number = 0, multibaseName = 'base36') {
    this._doctype = (typeof doctype === 'string') ? doctypes[doctype] : doctype
     if (!doctype && doctype !== 0) throw new Error('constructor: doctype required')
    this._subnet = (typeof subnet === 'string') ? subnets[subnet] : subnet
    this._multibaseName = multibaseName 
    this._cid = (typeof cid === 'string') ? new CID(cid) : cid
    if (!cid) throw new Error('constructor: cid required')
  }

  static fromBytes(bytes: Uint8Array, multibaseName?: string): DocID {
    const docCodec = varint.decode(bytes) 
    if (docCodec !== DOCID_CODEC) throw new Error('fromBytes: invalid docid, does not include docid codec')
    bytes = bytes.slice(varint.decode.bytes) 
    const subnet = varint.decode(bytes)
    bytes = bytes.slice(varint.decode.bytes) 
    const docType = varint.decode(bytes)
    bytes = bytes.slice(varint.decode.bytes) 
    const cid = new CID(bytes)
    return new DocID(docType, cid, subnet, multibaseName)
  }

  static fromString(docId: string): DocID {
    docId = docId.split('ceramic://').pop()
    const multibaseName = multibase.isEncoded(docId)
    const bytes = multibase.decode(docId)
    return DocID.fromBytes(bytes, multibaseName)
  }

  /**
   * Get doc type code
   *
   * @returns {number}
   * @readonly
   */
  get type (): number {
    return this._doctype
  }

  /**
   * Get doc type name
   *
   * @returns {string}
   * @readonly
   */
  get typeName (): string {
    const name = getKey(doctypes, this._doctype)
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
    const name = getKey(subnets, this._subnet)
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
    if (this._bytes == null) {
      const codec = varint.encode(DOCID_CODEC)
      const subnet = varint.encode(this._subnet)
      const doctype = varint.encode(this._doctype)
      this._bytes = uint8ArrayConcat([
        codec, subnet, doctype, this._cid.bytes
      ])
    }
    return this._bytes
  }

 /**
   * Compare equality with another DocID.
   *
   * @param   {DocID}   other
   * @returns {bool}
   */
  equals(other: DocID | Uint8Array | string): boolean {
    let otherDocID
    if (typeof other === 'string')
      otherDocID = DocID.fromString(other)
    else if (other instanceof Uint8Array) {
      otherDocID = DocID.fromBytes(other)
    } else {
      otherDocID = other
    }

    return this.type === otherDocID.type &&
      this.subnet === otherDocID.subnet &&
      this.cid.equals(otherDocID.cid)
  }

  /**
   * Encode the DocID into a string.
   *
   * @param   {string}   [base=this.multibaseName]   Base encoding to use.
   * @returns {string}
   */
  toBaseEncodedString (base: string = this.multibaseName): string {
    return uint8ArrayToString(multibase.encode(base, this.bytes))
  }

  /**
   * Encode the DocID into a string.
   *
   * @param   {string}   [base=this.multibaseName]   Base encoding to use.
   * @returns {string}
   */
  toString(base?: string): string {
    return this.toBaseEncodedString(base)
  }

  /**
   * Encode the DocID into a url
   *
   * @param   {string}   [base=this.multibaseName]   Base encoding to use.
   * @returns {string}
   */
  toUrl(base: string): string {
    return `ceramic://${this.toBaseEncodedString(base)}`
  }

  /**
   * DocId(k3y52l7mkcvtg023bt9txegccxe1bah8os3naw5asin3baf3l3t54atn0cuy98yws)
   *
   * @returns {String}
   */
  [Symbol.for('nodejs.util.inspect.custom')] (): string {
    return `DocID(${this.toString()})`
  }

  [Symbol.toPrimitive](hint: string): string | Uint8Array {
    if (hint === 'string') return this.toString()
    if (hint === 'default') return this.bytes
    throw new TypeError('DocId can not be cast to number')
  }

  /**
   * Determine if given DocID, DocID string or bytes is a valid DocID
   *
   * @param   {any}     other
   * @returns {bool}
   */
  static isDocID (other: any): boolean {
    try {
      if (typeof other === 'string') {
        DocID.fromString(other)
        return true
      } else if (other instanceof Uint8Array) {
        DocID.fromBytes(other)
        return true
      } else {
        return (other.type || other.type === 0) && (other.subnet || other.subnet === 0) && Boolean(other.cid)
      }
    } catch(e) {
      return false
    }
  }
}

export default DocID