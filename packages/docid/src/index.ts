import CID from 'cids'
import multibase from 'multibase'
import doctypes from './doctype-table'
import varint from 'varint'
import uint8ArrayConcat from 'uint8arrays/concat'
import uint8ArrayToString from 'uint8arrays/to-string'
const DOCID_CODEC = 206

const getKey = (obj: { [key: string]: number }, value: number): string | undefined => {
  for (const [k, v] of Object.entries(obj)) { 
    if (v === value) return k
  }
} 

// Definition
// '<multibase-prefix><multicodec-docid><doctype><genesis-cid-bytes>'
// '<multibase-prefix><multicodec-docid><doctype><genesis-cid-bytes><version-cid-bytes>'

class DocID {
  /**
   * Create a new DocID.
   *
   * @param {string|number}      doctype
   * @param {CID|string}         cid
   * @param {CID|string}         version
   * @param {string}             [multibaseName = 'base36']
   *
   * @example
   * new DocID(<docType>, <CID>|<cidStr>)
   * new DocID(<docType>, <CID>|<cidStr>, <VersionCID>|<VersionCidStr>, <multibaseName>)
   */

  private _doctype: number 
  private _cid: CID
  private _multibaseName: string
  private _bytes: Uint8Array
  private _version: CID | undefined

  constructor (doctype: string | number, cid: CID | string, version: CID | string | number = null, multibaseName = 'base36') {
    this._doctype = (typeof doctype === 'string') ? doctypes[doctype] : doctype
     if (!doctype && doctype !== 0) throw new Error('constructor: doctype required')
    this._multibaseName = multibaseName 
    this._cid = (typeof cid === 'string') ? new CID(cid) : cid
    if (version === '0' || typeof version === 'number') {
      this._version = this._cid
    } else {
      this._version = (typeof version === 'string') ? new CID(version) : version
    }
    if (!cid) throw new Error('constructor: cid required')
  }

  static fromBytes(bytes: Uint8Array, version?: CID | string, multibaseName?: string): DocID {
    const docCodec = varint.decode(bytes) 
    if (docCodec !== DOCID_CODEC) throw new Error('fromBytes: invalid docid, does not include docid codec')
    bytes = bytes.slice(varint.decode.bytes) 
    const docType = varint.decode(bytes)
    bytes = bytes.slice(varint.decode.bytes) 

    let cid

    try {
      cid = new CID(bytes)
      if (version === '0') version = cid
    } catch(e) {
      // Includes version
      const cidLength = DocID._genesisCIDLength(bytes)
      cid = new CID(bytes.slice(0, cidLength))
      const versionBytes = bytes.slice(cidLength)
      version = versionBytes.length === 1 ? cid : new CID(versionBytes)
    }

    return new DocID(docType, cid, version, multibaseName)
  }

  static _genesisCIDLength(bytes: Uint8Array): number {
    let offset = 0

    varint.decode(bytes) // cid version 
    offset += varint.decode.bytes

    varint.decode(bytes.slice(offset)) // cid codec
    offset += varint.decode.bytes

    varint.decode(bytes.slice(offset)) //mh codec
    offset += varint.decode.bytes

    const length = varint.decode(bytes.slice(offset)) //mh length
    return offset + length + 1
  }

  static fromString(docId: string, version?: CID | string): DocID {
    docId = docId.split('ceramic://').pop()
    // Likely temp, remove legacy once all ceramic update, but should make updating easier
    docId = docId.split('/ceramic/').pop()
    if (docId.includes('version')) {
      version = docId.split('?')[1].split('=')[1]
      docId = docId.split('?')[0]
    }
    const multibaseName = multibase.isEncoded(docId)
    if (!multibaseName) throw new Error('fromString: requires base encoded string')
    const bytes = multibase.decode(docId)
    return DocID.fromBytes(bytes, version, multibaseName)
  }


  /**
   * Get base docID, always returns without version
   *
   * @returns {DocID}
   * @readonly
   */
  get baseID (): DocID {
    if (!this.version) return this
    return new DocID(this.type, this.cid, null, this.multibaseName)
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
   * Get Version CID
   *
   * @returns {CID}
   * @readonly
   */
  get version (): CID | undefined {
    return this._version
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
      const doctype = varint.encode(this.type)

      let versionBytes 
      if (this.version) {
        versionBytes = this.cid.equals(this.version) ? varint.encode(0) : this.version.bytes
      } else {
        versionBytes = new Uint8Array(0)
      }

      this._bytes = uint8ArrayConcat([
        codec, doctype, this.cid.bytes, versionBytes
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
      (this.version ? this.version.equals(otherDocID.version) : !otherDocID.version) &&
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

  [Symbol.toPrimitive](): string | Uint8Array {
    return this.toString()
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
        return (other.type || other.type === 0) && Boolean(other.cid)
      }
    } catch(e) {
      return false
    }
  }
}

export default DocID