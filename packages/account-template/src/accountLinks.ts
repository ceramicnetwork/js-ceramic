import type { CeramicApi, CeramicDocument } from './types'

import { createLink } from '3id-blockchain-utils'

import { callRpc } from './utils' 

class AccountLinks {
  private _accountLinkDocuments: Record<string, CeramicDocument>;

  constructor (public ceramicDoc: CeramicDocument, private _ceramic: CeramicApi, public provider?: any) {
    this._accountLinkDocuments = {}
    this.ceramicDoc.on('change', this._loadAccountLinkDocs.bind(this))
  }

  getLinkedAddresses (): Array<string> {
    return Object.keys(this._accountLinkDocuments)
  }

  async linkAddress (address: string, proof?: Record<string, any>): Promise<void> {
    if (!proof) {
      if (!this.provider) {
        throw new Error('Provider must be set')
      }
      proof = await createLink(this.ceramicDoc.state.owners[0], address, this.provider)
    }
    const caip10Address = await this._convertToCaip10(address)
    if (this._accountLinkDocuments[caip10Address]) {
      throw new Error(`Address ${caip10Address} already linked`)
    }
    const accountLinkDoc = await this._ceramic.createDocument(null, 'account-link', {
      owners: [caip10Address],
      onlyGenesis: true
    })
    if (accountLinkDoc.content !== this.ceramicDoc.state.owners[0]) {
      await accountLinkDoc.change(proof)
    }
    
    await this.ceramicDoc.change([...this.ceramicDoc.content, accountLinkDoc.id])

    // need this here because the accountLinks tile 'change' event isn't triggered immediately
    this._accountLinkDocuments[caip10Address] = accountLinkDoc
  }

  async unlinkAddress (address: string): Promise<void> {
    const caip10Address = await this._convertToCaip10(address)
    if (!this._accountLinkDocuments[caip10Address]) {
      throw new Error(`Address ${caip10Address} not linked`)
    }
    const newContent = this.ceramicDoc.content.filter((docId: string) => docId !== this._accountLinkDocuments[caip10Address].id)
    await this.ceramicDoc.change(newContent)
    
    // need this here because the accountLinks tile 'change' event isn't triggered immediately
    delete this._accountLinkDocuments[caip10Address]
  }

  async _loadAccountLinkDocs(): Promise<void> {
    const docs: Array<CeramicDocument> = await Promise.all(this.ceramicDoc.content.map((docId: string) => this._ceramic.loadDocument(docId)))
    this._accountLinkDocuments = docs.reduce<Record<string, CeramicDocument>>((acc, doc) => {
      acc[doc.state.owners[0]] = doc
      return acc
    }, {})
  }

  async _convertToCaip10 (address: string): Promise<string> {
    let [accountAddress, chainId] = address.split('@')  // eslint-disable-line prefer-const
    if (!chainId) {
      let netVersion
      try {
        netVersion = await callRpc(this.provider, 'net_version')
      } catch (err) {
        console.warn('Provider RPC error, defaulting net_version to "1"', err)
        netVersion = '1'
      }
      chainId = 'eip155:' + netVersion
    }
    return [accountAddress, chainId].join('@').toLowerCase()
  }

  static async load (docId: string, ceramic: CeramicApi, provider?: any): Promise<AccountLinks> {
    const ceramicDoc = await ceramic.loadDocument(docId)
    const accountLinks = new AccountLinks(ceramicDoc, ceramic, provider)
    await accountLinks._loadAccountLinkDocs()
    return accountLinks
  }

  static async build (owner: string, ceramic: CeramicApi, provider?: any): Promise<AccountLinks> {
    const genesisContent: string[] = []
    const ceramicDoc = await ceramic.createDocument(genesisContent, 'tile', { owners: [owner] })
    const accountLinks = new AccountLinks(ceramicDoc, ceramic, provider)
    await accountLinks._loadAccountLinkDocs()
    return accountLinks
  }
}

export default AccountLinks
