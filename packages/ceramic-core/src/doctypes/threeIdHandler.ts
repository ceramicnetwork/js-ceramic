import type { DIDDocument } from 'did-resolver'
import { DocState, SignatureStatus, AnchorRecord, AnchorProof } from '../document'
import DoctypeHandler from './doctypeHandler'
import { wrapDocument } from '@ceramicnetwork/3id-did-resolver'
import jsonpatch from 'fast-json-patch'
import { verifyJWT } from 'did-jwt'

const DOCTYPE = '3id'


function head (log: Array<string>): string {
  return log[log.length - 1]
}

class ThreeIdHandler extends DoctypeHandler {

  constructor () {
    super(DOCTYPE)
  }

  async applyGenesis (record: any, cid: string): Promise<DocState> {
    // TODO - verify genesis record
    return {
      doctype: DOCTYPE,
      owners: record.owners,
      content: record.content,
      nextContent: null,
      signature: SignatureStatus.GENESIS,
      anchored: 0,
      log: [cid]
    }
  }

  async applySigned (record: any, cid: string, state: DocState): Promise<DocState> {
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
      // verify the jwt with a fake DID resolver that uses the current state of the 3ID
      const didDoc = wrapDocument({ publicKeys: { signing: state.owners[0], encryption: '' } }, 'did:fake:123')
      await verifyJWT(jwt, { resolver: { resolve: async (): Promise<DIDDocument> => didDoc } })
    } catch (e) {
      throw new Error('Invalid signature for signed record:' + e)
    }
    state.log.push(cid)
    return {
      ...state,
      signature: SignatureStatus.SIGNED,
      anchored: 0,
      nextContent: jsonpatch.applyPatch(state.content, record.content).newDocument
    }
  }

  async applyAnchor (record: AnchorRecord, proof: AnchorProof, cid: string, state: DocState): Promise<DocState> {
    state.log.push(cid)
    let content = state.content
    if (state.nextContent) {
      content = state.nextContent
      delete state.nextContent
    }
    return {
      ...state,
      content,
      anchored: proof.blockNumber
    }
  }

  async makeRecord (state: DocState, newContent: any): Promise<any> {
    if (!this.user) throw new Error('No user authenticated')
    const patch = jsonpatch.compare(state.content, newContent)
    const record: any = { content: patch, next: { '/': head(state.log) } }
    // TODO - use the dag-jose library for properly encoded signed records
    record.iss = this.user.DID
    const jwt = await this.user.sign(record, { useMgmt: true})
    const [header, payload, signature] = jwt.split('.') // eslint-disable-line @typescript-eslint/no-unused-vars
    return { ...record, header, signature }
  }

  async makeGenesis (content: any, owners?: Array<string>): Promise<any> {
    if (!owners) throw new Error('The owner of the 3ID needs to be specified')
    return {
      doctype: this.doctype,
      owners,
      content
    }
  }
}

export default ThreeIdHandler
