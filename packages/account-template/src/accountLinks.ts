import type { CeramicApi, CeramicDocument } from './types'

import { createLink } from '3id-blockchain-utils'
import { AccountID } from 'caip'

class AccountLinks {
  private _accountLinkDocuments: Record<string, CeramicDocument>;

  constructor (public ceramicDoc: CeramicDocument, private _ceramic: CeramicApi) {
    this._accountLinkDocuments = {}
    this.ceramicDoc.on('change', this._loadAccountLinkDocs.bind(this))
  }

  list (): Array<{ account: AccountID; docId: string }> {
    return Object.entries(this._accountLinkDocuments).map(([address, doc]) => {
      return {
        account: new AccountID(address),
        docId: doc.id
      }
    })
  }

  async add (account: AccountID | string, opts: { proof?: Record<string, any>; provider?: any }): Promise<void> {
    if (typeof account === 'string') {
      let [address, chainId] = account.split('@')
      if (!chainId) {
        chainId = 'eip155:1'
      }
      account = new AccountID({ address, chainId })
    }
    let proof = opts.proof
    if (!proof) {
      if (!opts.provider) {
        throw new Error('Provider must be set')
      }
      proof = await createLink(this.ceramicDoc.state.owners[0], account.address, opts.provider)
    }
    if (this._accountLinkDocuments[account.toString()]) {
      throw new Error(`Address ${account} already linked`)
    }
    const accountLinkDoc = await this._ceramic.createDocument(null, 'account-link', {
      owners: [account.toString()],
      onlyGenesis: true
    })
    if (accountLinkDoc.content !== this.ceramicDoc.state.owners[0]) {
      await accountLinkDoc.change(proof)
    }
    
    await this.ceramicDoc.change([...this.ceramicDoc.content, accountLinkDoc.id])

    // need this here because the accountLinks tile 'change' event isn't triggered immediately
    this._accountLinkDocuments[account.toString()] = accountLinkDoc
  }

  async remove (account: AccountID | string): Promise<void> {
    if (typeof account === 'string') {
      let [address, chainId] = account.split('@')
      if (!chainId) {
        chainId = 'eip155:1'
      }
      account = new AccountID({ address, chainId })
    }
    if (!this._accountLinkDocuments[account.toString()]) {
      throw new Error(`Address ${account} not linked`)
    }
    const newContent = this.ceramicDoc.content.filter((docId: string) => docId !== this._accountLinkDocuments[account.toString()].id)
    await this.ceramicDoc.change(newContent)
    
    // need this here because the accountLinks tile 'change' event isn't triggered immediately
    delete this._accountLinkDocuments[account.toString()]
  }

  async _loadAccountLinkDocs(): Promise<void> {
    const docs: Array<CeramicDocument> = await Promise.all(this.ceramicDoc.content.map((docId: string) => this._ceramic.loadDocument(docId)))
    this._accountLinkDocuments = docs.reduce<Record<string, CeramicDocument>>((acc, doc) => {
      acc[doc.state.owners[0]] = doc
      return acc
    }, {})
  }

  static async load (docId: string, ceramic: CeramicApi): Promise<AccountLinks> {
    const ceramicDoc = await ceramic.loadDocument(docId)
    const accountLinks = new AccountLinks(ceramicDoc, ceramic)
    await accountLinks._loadAccountLinkDocs()
    return accountLinks
  }

  static async build (owner: string, ceramic: CeramicApi): Promise<AccountLinks> {
    const genesisContent: string[] = []
    const ceramicDoc = await ceramic.createDocument(genesisContent, 'tile', { owners: [owner] })
    const accountLinks = new AccountLinks(ceramicDoc, ceramic)
    await accountLinks._loadAccountLinkDocs()
    return accountLinks
  }
}

export default AccountLinks
