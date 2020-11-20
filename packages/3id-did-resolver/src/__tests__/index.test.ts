jest.mock('cross-fetch', () =>  {
  return () => ({
    ok: true, 
    json: async () => JSON.parse('{"value":{"id":"did:3:GENESIS","@context":"https://w3id.org/did/v1","publicKey":[{"id":"did:3:GENESIS#signingKey","type":"Secp256k1VerificationKey2018","publicKeyHex":"0452fbcde75f7ddd7cff18767e2b5536211f500ad474c15da8e74577a573e7a346f2192ef49a5aa0552c41f181a7950af3afdb93cafcbff18156943e3ba312e5b2"},{"id":"did:3:GENESIS#encryptionKey","type":"Curve25519EncryptionPublicKey","publicKeyBase64":"DFxR24MNHVxEDAdL2f6pPEwNDJ2p0Ldyjoo7y/ItLDc="},{"id":"did:3:GENESIS#managementKey","type":"Secp256k1VerificationKey2018","ethereumAddress":"0x3f0bb6247d647a30f310025662b29e6fa382b61d"}],"authentication":[{"type":"Secp256k1SignatureAuthentication2018","publicKey":"did:3:GENESIS#signingKey"}]}}')
  })
})

import ThreeIdResolver from '../index'
import { Resolver } from 'did-resolver'
import DocID from '@ceramicnetwork/docid'

const ceramicMock = {
  loadDocument: async (): Promise<any> => ({
    content: {
      publicKeys: {
        signing: 'zQ3shwsCgFanBax6UiaLu1oGvM7vhuqoW88VBUiUTCeHbTeTV',
        encryption: 'z6LSfQabSbJzX8WAm1qdQcHCHTzVv8a2u6F7kmzdodfvUCo9'
      }
    }
  }),
  createDocument: async (): Promise<any> => ({
    id: DocID.fromString('k2t6wyfsu4pg0t2n4j8ms3s33xsgqjhtto04mvq8w5a2v5xo48idyz38l7ydki')
  })
}

const ceramicMockOld = { // to be removed
  loadDocument: async (): Promise<any> => ({
    content: {
      publicKeys: {
        signing: 'fake signing key',
        encryption: 'fake encryption key'
      }
    }
  })
}

const ceramicMockWithIDX = {
  loadDocument: async (): Promise<any> => ({
    content: {
      publicKeys: {
        signing: 'zQ3shwsCgFanBax6UiaLu1oGvM7vhuqoW88VBUiUTCeHbTeTV',
        encryption: 'z6LSfQabSbJzX8WAm1qdQcHCHTzVv8a2u6F7kmzdodfvUCo9'
      },
      idx: 'ceramic://rootId'
    }
  })
}

const ceramicMockNull = { // to be removed
  loadDocument: async (): Promise<any> => { return { } },
  createDocument: async (): Promise<any> => ({ id: 'k2t6wyfsu4pg0t2n4j8ms3s33xsgqjhtto04mvq8w5a2v5xo48idyz38l7ydki' })
}

const fake3ID = 'did:3:k2t6wyfsu4pg0t2n4j8ms3s33xsgqjhtto04mvq8w5a2v5xo48idyz38l7ydki'
const fakeLegacy3ID = 'did:3:bafyreiffkeeq4wq2htejqla2is5ognligi4lvjhwrpqpl2kazjdoecmugi'

describe('3ID DID Resolver', () => {

  it('getResolver works correctly', async () => {
    const threeIdResolver = ThreeIdResolver.getResolver(ceramicMock)
    expect(Object.keys(threeIdResolver)).toEqual(['3'])
  })

  it('resolver works correctly (old format)', async () => {
    const threeIdResolver = ThreeIdResolver.getResolver(ceramicMockOld)
    const resolver = new Resolver(threeIdResolver)
    expect(await resolver.resolve(fake3ID)).toMatchSnapshot()
  })

  it('resolves 3id document correctly', async () => {
    const threeIdResolver = ThreeIdResolver.getResolver(ceramicMock)
    const resolver = new Resolver(threeIdResolver)
    expect(await resolver.resolve(fake3ID)).toMatchSnapshot()
  })

  it('adds IDX root as service', async () => {
    const threeIdResolver = ThreeIdResolver.getResolver(ceramicMockWithIDX)
    const resolver = new Resolver(threeIdResolver)
    expect(await resolver.resolve(fake3ID)).toMatchSnapshot()
  })
})

describe('3ID DID Resolver Legacy (v0)', () => {
  it('resolves 3id v0', async () => {
    const threeIdResolver = ThreeIdResolver.getResolver(ceramicMockNull)
    const resolver = new Resolver(threeIdResolver)
    expect(await resolver.resolve(fakeLegacy3ID)).toMatchSnapshot()
  })

  it('resolves 3id v0 which includs ceramic updates', async () => {
    const threeIdResolver = ThreeIdResolver.getResolver(ceramicMock)
    const resolver = new Resolver(threeIdResolver)
    expect(await resolver.resolve(fakeLegacy3ID)).toMatchSnapshot()
  })
})
