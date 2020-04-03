import DoctypeHandler from './doctypeHandler'
import { DocState, SignatureStatus } from '../document'
import jsonpatch from 'fast-json-patch'
import { validateLink } from '3id-blockchain-utils'

const DOCTYPE = 'account-link'

function head (log: Array<string>): string {
  return log[log.length - 1]
}

class AccountLinkHandler extends DoctypeHandler {
  constructor () {
    super(DOCTYPE)
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

  async makeRecord (state: DocState, newContent: any): Promise<any> {
    const patch = jsonpatch.compare(state.content, newContent)
    const record = { content: patch, next: { '/': head(state.log) } }
    return record
  }

  async makeGenesis (content: any, owners: [string]): Promise<any> {
    if (typeof content !== 'undefined') throw new Error('Account link genesis cannot have content')
    return {
      doctype: this.doctype,
      owners
    }
  }

  async applyGenesis (record: any): Promise<DocState> {
    // TODO - verify genesis record
    return {
      doctype: DOCTYPE,
      owners: record.owners,
      content: null,
      nextContent: null,
      signature: SignatureStatus.GENESIS,
      anchored: 0,
      log: []
    }
  }

  async applySigned (record: any, state: DocState): Promise<DocState> {
    const nextContent = jsonpatch.applyPatch(state.content, record.content).newDocument
    if (!await validateLink(nextContent)) {
      throw new Error('Invalid proof for signed record')
    }
    return {
      ...state,
      signature: SignatureStatus.SIGNED,
      anchored: 0,
      nextContent
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
}

export default AccountLinkHandler
