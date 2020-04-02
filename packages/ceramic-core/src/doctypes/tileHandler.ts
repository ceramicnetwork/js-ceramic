import type Ceramic from '../ceramic'
import { DocState, SignatureStatus } from '../document'
import DoctypeHandler from './doctypeHandler'
import ThreeIdResolver from '../3id-did-resolver'
import { Resolver } from 'did-resolver'
import jsonpatch from 'fast-json-patch'
import { verifyJWT } from 'did-jwt'

const DOCTYPE = 'tile'


function head (log: Array<string>): string {
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

  async applyRecord (record: any, cid: string, state?: DocState): Promise<DocState> {
    let newState
    if (record.doctype) {
      newState = await this.applyGenesis(record)
    } else if (record.proof) {
      newState = await this.applyAnchor(record, state)
    } else if (record.content || record.owners) {
      newState = await this.applySigned(record, state)
    }
    newState.log.push(cid)
    return newState
  }

  async applyGenesis (record: any): Promise<DocState> {
    await this._verifyRecordSignature(record)
    // TODO - verify genesis record
    return {
      doctype: DOCTYPE,
      owners: record.owners,
      content: record.content,
      nextContent: null,
      signature: SignatureStatus.SIGNED,
      anchored: 0,
      log: []
    }
  }

  async applySigned (record: any, state: DocState): Promise<DocState> {
    await this._verifyRecordSignature(record)
    return {
      ...state,
      signature: SignatureStatus.SIGNED,
      anchored: 0,
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
      next: record.next,
      iss: record.iss
    })).toString('base64')
    if (payload.endsWith('=')) payload = payload.slice(0, -1)
    const jwt = [header, payload, signature].join('.')
    try {
      await verifyJWT(jwt, { resolver: this._didResolver })
    } catch (e) {
      console.error('error', e)
      throw new Error('Invalid signature for signed record:' + e)
    }
  }

  async applyAnchor (record: any, state: DocState): Promise<DocState> {
    // TODO - verify anchor record
    let content = state.content
    if (state.nextContent) {
      content = state.nextContent
      delete state.nextContent
    }
    return {
      ...state,
      content,
      anchored: record.proof.blockNumber
    }
  }

  async makeRecord (state: DocState, newContent: any): Promise<any> {
    if (!this.user) throw new Error('No user authenticated')
    const patch = jsonpatch.compare(state.content, newContent)
    const record = { content: patch, next: { '/': head(state.log) } }
    return this.signRecord(record)
  }

  async makeGenesis (content: any, owners?: Array<string>): Promise<any> {
    if (!this.user) throw new Error('No user authenticated')
    if (!owners) owners = [this.user.DID]
    const record = { doctype: this.doctype, owners, content }
    return this.signRecord(record)
  }

  async signRecord (record: any): Promise<any> {
    // TODO - use the dag-jose library for properly encoded signed records
    // The way we use did-jwts right now are quite hacky
    record.iss = this.user.DID
    const jwt = await this.user.sign(record)
    const [header, payload, signature] = jwt.split('.') // eslint-disable-line @typescript-eslint/no-unused-vars
    return { ...record, header, signature }
  }
}

export default TileHandler
