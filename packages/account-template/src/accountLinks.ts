import { createLink } from '3id-blockchain-utils'
import { AccountID } from 'caip'
import { CeramicApi } from "@ceramicnetwork/ceramic-common/lib/ceramic-api"
import { AccountLinkDoctype } from "@ceramicnetwork/ceramic-doctype-account-link/lib/account-link-doctype"
import { TileDoctype } from "@ceramicnetwork/ceramic-doctype-tile/lib/tile-doctype"

class AccountLinks {
  private _accountLinkDocuments: Record<string, AccountLinkDoctype>;

  constructor (public ceramicDoc: TileDoctype, private _ceramic: CeramicApi) {
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
      account = new AccountID(account)
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
    const accountLinkDoc = await this._ceramic.createDocument<AccountLinkDoctype>('account-link', {
      content: null,
      owners: [account.toString()]
    }, {
      onlyGenesis: true
    })
    if (accountLinkDoc.content !== this.ceramicDoc.state.owners[0]) {
      await accountLinkDoc.change( { content: proof }, { api: this._ceramic })
    }

    await this.ceramicDoc.change({ content: [...this.ceramicDoc.content, accountLinkDoc.id]}, { api: this._ceramic })

    // need this here because the accountLinks tile 'change' event isn't triggered immediately
    this._accountLinkDocuments[account.toString()] = accountLinkDoc
  }

  async remove (account: AccountID | string): Promise<void> {
    if (typeof account === 'string') {
      account = new AccountID(account)
    }
    if (!this._accountLinkDocuments[account.toString()]) {
      throw new Error(`Address ${account} not linked`)
    }
    const newContent = this.ceramicDoc.content.filter((docId: string) => docId !== this._accountLinkDocuments[account.toString()].id)
    await this.ceramicDoc.change({ content: newContent }, { api: this._ceramic })

    // need this here because the accountLinks tile 'change' event isn't triggered immediately
    delete this._accountLinkDocuments[account.toString()]
  }

  async _loadAccountLinkDocs(): Promise<void> {
    const docs: Array<AccountLinkDoctype> = await Promise.all(this.ceramicDoc.content.map((docId: string) => this._ceramic.loadDocument(docId)))
    this._accountLinkDocuments = docs.reduce<Record<string, AccountLinkDoctype>>((acc, doc) => {
      acc[doc.state.owners[0]] = doc
      return acc
    }, {})
  }

  static async load (docId: string, ceramic: CeramicApi): Promise<AccountLinks> {
    const ceramicDoc = await ceramic.loadDocument<TileDoctype>(docId)
    const accountLinks = new AccountLinks(ceramicDoc, ceramic)
    await accountLinks._loadAccountLinkDocs()
    return accountLinks
  }

  static async build (owner: string, ceramic: CeramicApi): Promise<AccountLinks> {
    const genesisContent: string[] = []
    const ceramicDoc = await ceramic.createDocument<TileDoctype>('tile', { content: genesisContent, owners: [owner] }, { isUnique: true })
    const accountLinks = new AccountLinks(ceramicDoc, ceramic)
    await accountLinks._loadAccountLinkDocs()
    return accountLinks
  }
}

export default AccountLinks
