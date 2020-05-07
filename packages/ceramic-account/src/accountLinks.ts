import type { CeramicApi, CeramicDocument } from './types'

class AccountLinks {
  private _accountLinkDocuments: Record<string, CeramicDocument>;

  constructor (public ceramicDoc: CeramicDocument, private _ceramic: CeramicApi, public provider?: any) {
    // Keep all account link documents open to receive updates
    this._accountLinkDocuments = {}
  }

  // The following can be implemented similarly to
  // https://github.com/3box/3box-js/blob/ceramic/src/accountLinks.js

  async getAllAddresses () { }

  async linkAddress (address: string, proof?: string) { }

  async unlinkAddress (address: string) { }

  static async build(owner: string, ceramic: CeramicApi, provider?: any): Promise<AccountLinks> {
    const genesisContent: string[] = []
    const ceramicDoc = await ceramic.createDocument(genesisContent, 'tile', { owners: [owner] })
    return new AccountLinks(ceramicDoc, ceramic, provider)
  }
}

export default AccountLinks
