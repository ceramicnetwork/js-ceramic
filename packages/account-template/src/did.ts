import { CeramicApi } from "@ceramicnetwork/ceramic-common"
import { TileDoctype } from "@ceramicnetwork/ceramic-doctype-tile"
import { ThreeIdDoctype } from "@ceramicnetwork/ceramic-doctype-three-id"

class DIDDocument {
  constructor (public ceramicDoc: ThreeIdDoctype, private _ceramic: CeramicApi) { }

  get did (): string {
    return 'did:3:' + this.ceramicDoc.state.log[0]
  }

  async setAccountTile (accountTile: TileDoctype): Promise<void> {
    if (this.ceramicDoc.content.account) {
      throw new Error(`Account tile already linked: ${this.ceramicDoc.content.account}`)
    }
    await this.ceramicDoc.change({ content: {...this.ceramicDoc.content, account: accountTile.id } }, { api: this._ceramic })
  }

  static async load (did: string, ceramic: CeramicApi): Promise<DIDDocument> {
    const didPrefix = 'did:3:'
    if (!did.startsWith(didPrefix)) {
      throw new Error('Only 3IDs allowed')
    }
    const cid = did.slice(didPrefix.length)
    const ceramicDoc = await ceramic.loadDocument<ThreeIdDoctype>(`/ceramic/${cid}`)
    return new DIDDocument(ceramicDoc, ceramic)
  }

  static async build (keys: {managementKey: string; signingKey: string; encryptionKey: string }, ceramic: CeramicApi): Promise<DIDDocument> {
    const ceramicDoc = await ceramic.createDocument<ThreeIdDoctype>('3id', {
      content: {
        publicKeys: {
          signing: keys.signingKey, encryption: keys.encryptionKey
        },
      }, owners: [keys.managementKey]
    })
    return new DIDDocument(ceramicDoc, ceramic)
  }
}

export default DIDDocument
