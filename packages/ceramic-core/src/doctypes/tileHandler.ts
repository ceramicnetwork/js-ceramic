import Ceramic from '../ceramic'
import CID from 'cids'
import { AnchorProof, AnchorRecord, AnchorStatus, DocState, SignatureStatus } from '../document'
import DoctypeHandler from './doctypeHandler'
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import { Resolver } from 'did-resolver'
import jsonpatch from 'fast-json-patch'
import { verifyJWT } from 'did-jwt'
import { encode as base64Encode } from '@ethersproject/base64'
import { randomBytes } from '@ethersproject/random'

const DOCTYPE = 'tile'


function head (log: Array<CID>): CID {
  return log[log.length - 1]
}

class TileHandler extends DoctypeHandler {
  private _didResolver: Resolver

  constructor (ceramic: Ceramic, opts: any = {}) {
    super(DOCTYPE)
    const threeIdResolver = ThreeIdResolver.getResolver(ceramic)
    this._didResolver = new Resolver({
      ...opts.didResolvers,
      ...threeIdResolver
    })
  }

  async applyGenesis (record: any, cid: CID): Promise<DocState> {
    await this._verifyRecordSignature(record)
    // TODO - verify genesis record
    return {
      doctype: DOCTYPE,
      owners: record.owners,
      content: record.content,
      nextContent: null,
      signature: SignatureStatus.SIGNED,
      anchorStatus: AnchorStatus.NOT_REQUESTED,
      log: [cid]
    }
  }

  async applySigned (record: any, cid: CID, state: DocState): Promise<DocState> {
    if (!record.id.equals(state.log[0])) throw new Error(`Invalid docId ${record.id}, expected ${state.log[0]}`)
    await this._verifyRecordSignature(record)
    state.log.push(cid)
    return {
      ...state,
      signature: SignatureStatus.SIGNED,
      anchorStatus: AnchorStatus.NOT_REQUESTED,
      nextContent: jsonpatch.applyPatch(state.content, record.content).newDocument
    }
  }

  async _verifyRecordSignature(record: any): Promise<void> {
    // reconstruct jwt
    const { header, signature } = record
    delete record.header
    delete record.signature
    let payload = Buffer.from(JSON.stringify({
      doctype: record.doctype,
      owners: record.owners,
      content: record.content,
      unique: record.unique || undefined,
      prev: record.prev ? { '/': record.prev.toString() } : undefined,
      id: record.id ? { '/': record.id.toString() } : undefined,
      iss: record.iss
    })).toString('base64')
    payload = payload.replace(/=/g, '')
    const jwt = [header, payload, signature].join('.')
    try {
      await verifyJWT(jwt, { resolver: this._didResolver })
    } catch (e) {
      throw new Error('Invalid signature for signed record:' + e)
    }
  }

  async applyAnchor (record: AnchorRecord, proof: AnchorProof, cid: CID, state: DocState): Promise<DocState> {
    state.log.push(cid)
    let content = state.content
    if (state.nextContent) {
      content = state.nextContent
      delete state.nextContent
    }
    return {
      ...state,
      content,
      anchorStatus: AnchorStatus.ANCHORED,
      anchorProof: proof,
    }
  }

  async makeRecord (state: DocState, newContent: any): Promise<any> {
    if (!this.user) throw new Error('No user authenticated')
    const patch = jsonpatch.compare(state.content, newContent)
    const record = { content: patch, prev: head(state.log), id: state.log[0] }
    return this.signRecord(record)
  }

  async makeGenesis (content: any, owners?: Array<string>, opts: { isUnique?: boolean } = {}): Promise<any> {
    if (!this.user) throw new Error('No user authenticated')
    if (!owners) owners = [this.user.DID]
    let unique: string
    if (opts.isUnique) {
      unique = base64Encode(randomBytes(9))
    }
    const record = { doctype: this.doctype, owners, content, unique }
    return this.signRecord(record)
  }

  async signRecord (record: any): Promise<any> {
    // TODO - use the dag-jose library for properly encoded signed records
    // The way we use did-jwts right now are quite hacky
    record.iss = this.user.DID
    // convert CID to string for signing
    const tmpCID = record.prev
    const tmpId = record.id
    if (tmpCID) record.prev = { '/': tmpCID.toString() }
    if (tmpId) record.id = { '/': tmpId.toString() }
    const jwt = await this.user.sign(record)
    const [header, payload, signature] = jwt.split('.') // eslint-disable-line @typescript-eslint/no-unused-vars
    if (tmpCID) record.prev = tmpCID
    if (tmpId) record.id = tmpId
    return { ...record, header, signature }
  }
}

export default TileHandler
