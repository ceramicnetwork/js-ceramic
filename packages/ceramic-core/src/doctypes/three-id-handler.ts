import { DIDDocument } from 'did-resolver'
import CID from 'cids'
import DoctypeHandler from './doctype-handler'
import { wrapDocument } from '@ceramicnetwork/3id-did-resolver'
import jsonpatch from 'fast-json-patch'
import { verifyJWT } from 'did-jwt'
import { AnchorProof, AnchorRecord, AnchorStatus, DocState, SignatureStatus } from "../doctype"

const DOCTYPE = '3id'


function head (log: Array<CID>): CID {
  return log[log.length - 1]
}

class ThreeIdHandler extends DoctypeHandler {

  constructor () {
    super(DOCTYPE)
  }

  async applyGenesis (record: any, cid: CID): Promise<DocState> {
    if(record.doctype === DOCTYPE) {
      return {
        doctype: DOCTYPE,
        owners: record.owners,
        content: record.content,
        nextContent: null,
        signature: SignatureStatus.GENESIS,
        anchorStatus: AnchorStatus.NOT_REQUESTED,
        log: [cid]
      }
    } else if (record['@context'] === "https://w3id.org/did/v1") {
      const managementKey = record.publicKey.find((pk: { id: string }) => pk.id === 'did:3:GENESIS#managementKey').ethereumAddress
      const signingKey = record.publicKey.find((pk: { id: string }) => pk.id === 'did:3:GENESIS#signingKey').publicKeyHex
      const encryptionKey = record.publicKey.find((pk: { id: string }) => pk.id === 'did:3:GENESIS#encryptionKey').publicKeyBase64
      return {
        doctype: DOCTYPE,
        owners: [managementKey],
        content: {
          publicKeys: {
            signing: signingKey,
            encryption: encryptionKey
          }
        },
        nextContent: null,
        signature: SignatureStatus.GENESIS,
        anchorStatus: AnchorStatus.NOT_REQUESTED,
        log: [cid]
      }
    }
    // TODO - verify genesis record
  }

  async applySigned (record: any, cid: CID, state: DocState): Promise<DocState> {
    if (!record.id.equals(state.log[0])) throw new Error(`Invalid docId ${record.id}, expected ${state.log[0]}`)
    // reconstruct jwt
    const { header, signature } = record
    delete record.header
    delete record.signature
    let payload = Buffer.from(JSON.stringify({
      doctype: record.doctype,
      owners: record.owners,
      content: record.content,
      prev: { '/': record.prev.toString() },
      id: { '/': record.id.toString() },
      iss: record.iss
    })).toString('base64')
    payload = payload.replace(/=/g, '')
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
      anchorStatus: AnchorStatus.NOT_REQUESTED,
      nextContent: jsonpatch.applyPatch(state.content, record.content).newDocument,
      nextOwners: record.owners
    }
  }

  async applyAnchor (record: AnchorRecord, proof: AnchorProof, cid: CID, state: DocState): Promise<DocState> {
    state.log.push(cid)
    let content = state.content
    if (state.nextContent) {
      content = state.nextContent
      delete state.nextContent
    }
    let owners = state.owners
    if (state.nextOwners) {
      owners = state.nextOwners
      delete state.nextOwners
    }
    return {
      ...state,
      owners,
      content,
      anchorStatus: AnchorStatus.ANCHORED,
      anchorProof: proof,
    }
  }

  async makeRecord (state: DocState, newContent: any, newOwners?: Array<string>): Promise<any> {
    if (!this.user) throw new Error('No user authenticated')
    if (typeof newContent === 'undefined') {
      newContent = state.content
    }
    const patch = jsonpatch.compare(state.content, newContent)
    const record: any = { owners: newOwners, content: patch, prev: head(state.log), id: state.log[0] }
    // TODO - use the dag-jose library for properly encoded signed records
    record.iss = this.user.DID
    // convert CID to string for signing
    const tmpPrev = record.prev
    const tmpId = record.id
    record.prev = { '/': tmpPrev.toString() }
    record.id = { '/': tmpId.toString() }
    const jwt = await this.user.sign(record, { useMgmt: true})
    const [header, payload, signature] = jwt.split('.') // eslint-disable-line @typescript-eslint/no-unused-vars
    record.prev = tmpPrev
    record.id = tmpId
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
