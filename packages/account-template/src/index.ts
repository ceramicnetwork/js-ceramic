import type { CeramicApi, CeramicDocument } from './types'

import DIDDocument from './did'
import AccountLinks from './accountLinks'



// All of these could likely inherit from a AccountSubTile abstract parent class or a builder class

class Keychain {
  constructor (public ceramicDoc: CeramicDocument, private _ceramic: CeramicApi) { }

  static async build(owner: string, ceramic: CeramicApi): Promise<Keychain> {
    const genesisContent: Record<string, string[]> = {
      "privacy-policy-read-keys": [],
      "auth-public-keys": [],
      "auth-data": [],
      "legacy-data": []
    }
    const ceramicDoc = await ceramic.createDocument(genesisContent, 'tile', { owners: [owner] })
    return new Keychain(ceramicDoc, ceramic)
  }
}

class Profile {
  constructor (public ceramicDoc: CeramicDocument, private _ceramic: CeramicApi) { }

  static async build(owner: string, ceramic: CeramicApi): Promise<Profile> {
    const genesisContent: Record<string, any> = {}
    const ceramicDoc = await ceramic.createDocument(genesisContent, 'tile', { owners: [owner] })
    return new Profile(ceramicDoc, ceramic)
  }
}

class Sources {
  constructor (public ceramicDoc: CeramicDocument, private _ceramic: CeramicApi) { }

  static async build(owner: string, ceramic: CeramicApi): Promise<Sources> {
    const genesisContent: string[] = []
    const ceramicDoc = await ceramic.createDocument(genesisContent, 'tile', { owners: [owner] })
    return new Sources(ceramicDoc, ceramic)
  }
}

class Services {
  constructor (public ceramicDoc: CeramicDocument, private _ceramic: CeramicApi) { }

  static async build(owner: string, ceramic: CeramicApi): Promise<Services> {
    const genesisContent: any[] = []
    const ceramicDoc = await ceramic.createDocument(genesisContent, 'tile', { owners: [owner] })
    return new Services(ceramicDoc, ceramic)
  }
}


class ThreeIDAccount {
  [key: string]: any // allow access to properties using index notation (ex: account['services'])

  constructor (public ceramicDoc: CeramicDocument, public didDocument: DIDDocument, public accountLinks: AccountLinks, public keychain: Keychain, public profile: Profile, public sources: Sources, public services: Services, private _ceramic: CeramicApi, public provider?: any) { }

  get DID (): string {
    return this.didDocument.did
  }

  static async build (did: string, ceramic: CeramicApi, provider?: any): Promise<ThreeIDAccount> {
    const didDocument = await DIDDocument.load(did, ceramic)

    // The incremental building of an account tile here is a good example of how creating a buffered
    // document type would reduce number of writes, speeding up creation, but more importantly, 
    // all future fetches due to less DAG depth

    let ceramicDoc
    if (didDocument.ceramicDoc.content.account) {
      ceramicDoc = await ceramic.loadDocument(didDocument.ceramicDoc.content.account)
      console.log('FOUND account tile', ceramicDoc.id)
    } else {
      const genesisContent: Record<string, string> = {}
      ceramicDoc = await ceramic.createDocument(genesisContent, 'tile', { owners: [didDocument.did] })
      await didDocument.setAccountTile(ceramicDoc)
      console.log('CREATED account tile', ceramicDoc.id)
    }

    // Load/create subtiles

    let accountLinks: AccountLinks
    if (ceramicDoc.content['account-links']) {
      accountLinks = await AccountLinks.load(ceramicDoc.content['account-links'], ceramic, provider)
    } else {
      accountLinks = await AccountLinks.build(did, ceramic, provider)
      await ceramicDoc.change({ ...ceramicDoc.content, 'account-links': accountLinks.ceramicDoc.id })
    }

    let keychain: Keychain
    if (ceramicDoc.content.keychain) {
      const subtileDocument = await ceramic.loadDocument(ceramicDoc.content.keychain)
      keychain = new Keychain(subtileDocument, ceramic)
    } else {
      keychain = await Keychain.build(did, ceramic)
      await ceramicDoc.change({ ...ceramicDoc.content, keychain: keychain.ceramicDoc.id })
    }

    let profile: Profile
    if (ceramicDoc.content.profile) {
      const subtileDocument = await ceramic.loadDocument(ceramicDoc.content.profile)
      profile = new Profile(subtileDocument, ceramic)
    } else {
      profile = await Profile.build(did, ceramic)
      await ceramicDoc.change({ ...ceramicDoc.content, profile: profile.ceramicDoc.id })
    }

    let sources: Sources
    if (ceramicDoc.content.sources) {
      const subtileDocument = await ceramic.loadDocument(ceramicDoc.content.sources)
      sources = new Sources(subtileDocument, ceramic)
    } else {
      sources = await Sources.build(did, ceramic)
      await ceramicDoc.change({ ...ceramicDoc.content, sources: sources.ceramicDoc.id })
    }

    let services: Services
    if (ceramicDoc.content.services) {
      const subtileDocument = await ceramic.loadDocument(ceramicDoc.content.services)
      services = new Services(subtileDocument, ceramic)
    } else {
      services = await Services.build(did, ceramic)
      await ceramicDoc.change({ ...ceramicDoc.content, services: services.ceramicDoc.id })
    }

    return new ThreeIDAccount(ceramicDoc, didDocument, accountLinks, keychain, profile, sources, services, ceramic, provider)
  }
}

export default ThreeIDAccount
