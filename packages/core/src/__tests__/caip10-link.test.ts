import { jest } from '@jest/globals'
import tmp from 'tmp-promise'
import { Caip10Link } from '@ceramicnetwork/stream-caip10-link'
import { AnchorStatus, StreamUtils, IpfsApi } from '@ceramicnetwork/common'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import MockDate from 'mockdate'
import { Ceramic, CeramicConfig } from '../ceramic.js'
import { anchorUpdate } from '../state-management/__tests__/anchor-update.js'

const DID_USED = 'did:3:bafysdfwefwe'
const LEGACY_ACCOUNT = '0x8fe2c4516e920425e177658aaac451ca0463ed69@eip155:1337'
const ACCOUNT = 'eip155:1337:0x8fe2c4516e920425e177658aaac451ca0463ed69'
const PROOF = {
  version: 2,
  type: 'ethereum-eoa',
  message:
    'Link this account to your identity\n' +
    '\n' +
    'did:3:bafysdfwefwe \n' +
    'Timestamp: 1641461695',
  signature:
    '0xbbc62f3184daeb0b5792b50797c493f144b5811a5b634e450329bcdc919f5e2c20166bfde97748fd7ec3281af95230c056e2a89ce9f07420b326440f158d05e21c',
  account: 'eip155:1337:0x8fe2c4516e920425e177658aaac451ca0463ed69',
  timestamp: 1641461695,
}
const LEGACY_PROOF = {
  ...PROOF,
  account: LEGACY_ACCOUNT
}
const EMPTY_DID_PROOF = {
  version: 2,
  type: 'ethereum-eoa',
  message: 'Link this account to your identity\n\n \nTimestamp: 1641462800',
  signature:
    '0xc353c06cf5d77c5105d72779f1de8a1f38ebead0f7686e9d90e83e445d5a7a640cb50df30cd268ca4dffcf6ffcf71dce7c53d4688e074990d00b5e06058cd87d1b',
  account: 'eip155:1337:0x8fe2c4516e920425e177658aaac451ca0463ed69',
  timestamp: 1641462800,
}


describe('Ceramic API', () => {
  jest.setTimeout(60000)
  let ipfs: IpfsApi

  const createCeramic = (c: CeramicConfig = {}): Promise<Ceramic> => {
    c.anchorOnRequest = false // Config option for InMemoryAnchorService
    c.verifySignatures = false // Config option for InMemoryAnchorService
    return Ceramic.create(ipfs, c)
  }

  beforeAll(async () => {
    ipfs = await createIPFS()
    MockDate.set('2018-10-01') // So that the anchors happen at a predictable blockNumber/blockTimestamp
  })

  afterAll(async () => {
    MockDate.reset()
    await ipfs.stop()
  })

  describe('Caip10Link test', () => {
    let ceramic: Ceramic
    let authProvider
    let tmpFolder: tmp.DirectoryResult

    beforeEach(async () => {
      tmpFolder = await tmp.dir({ unsafeCleanup: true })
      ceramic = await createCeramic({ stateStoreDirectory: tmpFolder.path })
      authProvider = { createLink: jest.fn() }
    })

    afterEach(async () => {
      await ceramic.close()
      await tmpFolder.cleanup()
    })

    it('Create from valid account id', async () => {
      const link = await Caip10Link.fromAccount(ceramic, ACCOUNT)
      expect(link.metadata.controllers).toHaveLength(1)
      expect(link.metadata.controllers[0]).toEqual(LEGACY_ACCOUNT.toLowerCase())
      expect(link.did).toBeNull()
      expect(link.state.log).toHaveLength(1)
      expect(link.state).toMatchSnapshot()
    })

    it('Create from legacy account id', async () => {
      const link = await Caip10Link.fromAccount(ceramic, LEGACY_ACCOUNT)
      expect(link.metadata.controllers).toHaveLength(1)
      expect(link.metadata.controllers[0]).toEqual(LEGACY_ACCOUNT.toLowerCase())
      expect(link.did).toBeNull()
      expect(link.state.log).toHaveLength(1)
      expect(link.state).toMatchSnapshot()
    })

    it('invalid account id', async () => {
      const invalid1 = '0x0544DcF4fcE959C6C4F3b7530190cB5E1BD67Cb8'
      const invalid2 = '0x0544DcF4fcE959C6C4F3b7530190cB5E1BD67Cb8@eip155'
      const invalid3 = '@eip155:1'
      await expect(Caip10Link.fromAccount(ceramic, invalid1)).rejects.toThrow(
        /Invalid accountId provided/
      )
      await expect(Caip10Link.fromAccount(ceramic, invalid2)).rejects.toThrow(
        /Invalid chainId provided/
      )
      await expect(Caip10Link.fromAccount(ceramic, invalid3)).rejects.toThrow(
        /Invalid accountId provided/
      )
    })

    it('Create and link DID', async () => {
      authProvider.createLink.mockReturnValueOnce(PROOF)

      const link = await Caip10Link.fromAccount(ceramic, LEGACY_ACCOUNT)
      await link.setDid(DID_USED, authProvider, { anchor: false })

      expect(link.did).toEqual(DID_USED)
      expect(link.state.log).toHaveLength(2)
      expect(authProvider.createLink).toHaveBeenCalledTimes(1)
      expect(link.state).toMatchSnapshot()
    })

    it('Create and link DID with legacy CAIP proof', async () => {
      authProvider.createLink.mockReturnValueOnce(LEGACY_PROOF)

      const link = await Caip10Link.fromAccount(ceramic, ACCOUNT)
      await link.setDid(DID_USED, authProvider, { anchor: false })

      expect(link.did).toEqual(DID_USED)
      expect(link.state.log).toHaveLength(2)
      expect(authProvider.createLink).toHaveBeenCalledTimes(1)
      expect(link.state).toMatchSnapshot()
    })

    it('Created with same address loads same doc', async () => {
      authProvider.createLink.mockReturnValueOnce(PROOF)

      const link1 = await Caip10Link.fromAccount(ceramic, LEGACY_ACCOUNT)
      await link1.setDid(DID_USED, authProvider, { anchor: false })

      const link2 = await Caip10Link.fromAccount(ceramic, LEGACY_ACCOUNT)
      expect(link1.id).toEqual(link2.id)
      expect(link1.did).toEqual(DID_USED)
      expect(link2.did).toEqual(link1.did)
      expect(StreamUtils.serializeState(link2.state)).toEqual(
        StreamUtils.serializeState(link1.state)
      )
    })

    it('Load works', async () => {
      authProvider.createLink.mockReturnValueOnce(PROOF)

      const link1 = await Caip10Link.fromAccount(ceramic, LEGACY_ACCOUNT)
      await link1.setDid(DID_USED, authProvider, { anchor: false })

      const link2 = await Caip10Link.load(ceramic, link1.id)
      expect(link1.id).toEqual(link2.id)
      expect(link1.did).toEqual(DID_USED)
      expect(link2.did).toEqual(link1.did)
      expect(StreamUtils.serializeState(link2.state)).toEqual(
        StreamUtils.serializeState(link1.state)
      )
    })

    it('Anchoring works', async () => {
      authProvider.createLink.mockReturnValueOnce(PROOF)

      const link = await Caip10Link.fromAccount(ceramic, LEGACY_ACCOUNT, { anchor: true })
      expect(link.state.anchorStatus).toEqual(AnchorStatus.PENDING)
      await anchorUpdate(ceramic, link)
      expect(link.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      await link.setDid(DID_USED, authProvider, { anchor: true })
      expect(link.state.anchorStatus).toEqual(AnchorStatus.PENDING)
      await anchorUpdate(ceramic, link)
      expect(link.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      expect(link.did).toEqual(DID_USED)
      expect(link.state.log).toHaveLength(4)
      expect(link.state).toMatchSnapshot()
    })

    it('Throws when linking to invalid DID ', async () => {
      const link = await Caip10Link.fromAccount(ceramic, ACCOUNT)

      const invalidDids = [
        'did:incomplete',
        '  oddPrefixdid:stuff:stuff',
        'did:CAPITALS:stuff',
        'did:&&specialChar:stuff',
        'did:test:%1maw',
      ]

      await Promise.all(
        invalidDids.map(async (did) => {
          await expect(link.setDid(did, authProvider)).rejects.toThrow(/DID is not valid/)
        })
      )
    })

    it('Clear did works', async () => {
      const link = await Caip10Link.fromAccount(ceramic, LEGACY_ACCOUNT)
      await expect(link.did).toBeNull()

      authProvider.createLink.mockReturnValueOnce(PROOF)
      await link.setDid(DID_USED, authProvider)
      await expect(link.did).toEqual(DID_USED)

      authProvider.createLink.mockReturnValueOnce(EMPTY_DID_PROOF)
      await link.clearDid(authProvider)
      await expect(link.did).toBeNull()
    })
  })
})
