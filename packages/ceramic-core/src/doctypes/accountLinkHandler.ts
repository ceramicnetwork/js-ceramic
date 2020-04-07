import DoctypeHandler from './doctypeHandler'
import { DocState, SignatureStatus, AnchorProof } from '../document'
import { validateLink } from '3id-blockchain-utils'

const DOCTYPE = 'account-link'

function head (log: Array<string>): string {
  return log[log.length - 1]
}

class AccountLinkHandler extends DoctypeHandler {
  constructor () {
    super(DOCTYPE)
  }

  async makeRecord (state: DocState, proof: any): Promise<any> {
    const record = { content: proof, next: { '/': head(state.log) } }
    return record
  }

  async makeGenesis (content: any, owners: [string]): Promise<any> {
    if (content) throw new Error('Account link genesis cannot have content')
    if (!owners) throw new Error('Owner must be specified')
    if (owners.length !== 1) throw new Error('Exactly one owner must be specified')
    const [address, chainId] = owners[0].split('@')
    if (!chainId) throw new Error('Chain ID must be specified according to CAIP-10')
    if (chainId !== 'eip155:1') throw new Error('Only Ethereum mainnet supported')
    return {
      doctype: this.doctype,
      owners,
    }
  }

  async applyGenesis (record: any, cid: string): Promise<DocState> {
    // TODO - verify genesis record
    return {
      doctype: DOCTYPE,
      owners: record.owners,
      content: null,
      nextContent: null,
      signature: SignatureStatus.GENESIS,
      anchored: 0,
      log: [cid]
    }
  }

  async applySigned (record: any, cid: string, state: DocState): Promise<DocState> {
    const validProof = await validateLink(record.content)
    if (!validProof) throw new Error('Invalid proof for signed record')
    // TODO: handle CAIP-10 addresses in proof generation of 3id-blockchain-utils
    let [address, chainId] = validProof.address.split('@')  // eslint-disable-line prefer-const
    if (!chainId) chainId = 'eip155:1'
    const addressCaip10 = [address, chainId].join('@')
    if (addressCaip10.toLowerCase() !== state.owners[0].toLowerCase()) {
      throw new Error("Address doesn't match document owner")
    }
    state.log.push(cid)
    return {
      ...state,
      signature: SignatureStatus.SIGNED,
      anchored: 0,
      nextContent: validProof.did
    }
  }

  async applyAnchor (record: any, proof: AnchorProof, cid: string, state: DocState): Promise<DocState> {
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
}

export default AccountLinkHandler
