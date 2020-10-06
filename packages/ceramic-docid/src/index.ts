import CID from 'cids'
const multibase = require('multibase')
const subnets = require('./subnet-table.json')
const doctypes = require('./doctype-table.json')
const varint = require('varint')
const uint8ArrayConcat = require('uint8arrays/concat')
const uint8ArrayToString = require('uint8arrays/to-string')
const uint8ArrayEquals = require('uint8arrays/equals')
const DOCID_CODEC = 206

// Definition
// '<multibase-prefix><multicodec-docid><subnet><doctype><genesis-cid-bytes>'

class DocId {
  /**
   * Create a new DocId.
   *
   * @param {string|Uint8Array}  doctype
   * @param {CID|string}         [cid]
   * @param {string}             [multihash = 'devnet']
   * @param {string}             [multibaseName = 'base32']
   *
   * @example
   * new DocId(<docType>, <CID>|<cidStr>)
   * new DocId(<docType>, <CID>|<cidStr>, <subnet>, <multibaseName>)
   * new DocId(<docIdStr>)
   * new DocId(<bytes>, <multibaseName>)  
   */

  private _docType: string 
  private _subnet: string
  private _cid: CID
  private _cidBytes: Uint8Array
  private _multibaseName: string

  constructor (doctype: string | Uint8Array, cid: CID | string, subnet?: string, multibaseName?: string) {
    if (doctype instanceof Uint8Array) {
      // Given uint8 array DocId
      const bytes = doctype 
      this._multibaseName = typeof cid === 'string' ? cid : 'base32'
      this._initFromBytes(bytes)
    } else if (Object.keys(doctypes).includes(doctype)) {
      // From args
      if (!doctype) throw new Error('constructor: doctype required')
      if (!cid) throw new Error('constructor: cid required')
      this._docType = doctype
      this._subnet = subnet || 'devnet'
      this._multibaseName = multibaseName || 'base32'
      this._cid = (typeof cid === 'string') ? new CID(cid) : cid
      this._cidBytes = this._cid.bytes
    } else if (typeof doctype === 'string') {
      // From DocIdString
      const docIdStr = doctype
      this._multibaseName = multibase.isEncoded(docIdStr)
      const bytes = multibase.decode(docIdStr).slice(2)
      this._initFromBytes(bytes)
    } else {
      throw new Error('constructor: Invalid Arguments or CID')
    }
  }

  _initFromBytes(bytes: Uint8Array): void {
    this._subnet = subnets[varint.decode(bytes)]
    bytes = bytes.slice(varint.decode.bytes) 
    this._docType = doctypes[varint.decode(bytes)]
    bytes = bytes.slice(varint.decode.bytes) 
    this._cid = new CID(bytes)
    this._cidBytes = this._cid.bytes
  }

  /**
   * Get doc type string
   *
   * @returns {string}
   * @readonly
   */
  get docType (): string {
    return this._docType
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
   * Get subnet name string
   *
   * @returns {string}
   * @readonly
   */
  get subnet (): string {
    return this._subnet
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
    const subnet = varint.encode(subnets[this.subnet])
    const doctype = varint.encode(doctypes[this.docType])
    const bytes = uint8ArrayConcat([
      codec, subnet, doctype, this._cidBytes
    ], codec.byteLength, subnet.byteLength, doctype.byteLength, this._cidBytes.byteLength)
    return bytes
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