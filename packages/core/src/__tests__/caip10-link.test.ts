import Ceramic, { CeramicConfig } from '../ceramic'
import { Caip10LinkDoctype } from "@ceramicnetwork/doctype-caip10-link"
import { AnchorStatus, DoctypeUtils, IpfsApi } from "@ceramicnetwork/common"
import { Ed25519Provider } from 'key-did-provider-ed25519'
import KeyDidResolver from 'key-did-resolver'
import { Resolver } from "did-resolver"
import { DID } from 'dids'
import * as u8a from 'uint8arrays'
import { createIPFS } from './ipfs-util';
import { anchorUpdate } from '../state-management/__tests__/anchor-update';
import MockDate from 'mockdate'

jest.mock('../store/level-state-store')

const seed = u8a.fromString('6e34b2e1a9624113d81ece8a8a22e6e97f0e145c25c1d4d2d0e62753b4060c83', 'base16')

describe('Ceramic API', () => {
  jest.setTimeout(60000)
  let ipfs: IpfsApi;

  const makeDID = function(seed: Uint8Array): DID {
    const provider = new Ed25519Provider(seed)

    const keyDidResolver = KeyDidResolver.getResolver()
    const resolver = new Resolver({ ...keyDidResolver })
    return new DID({ provider, resolver })
  }

  const createCeramic = async (c: CeramicConfig = {}): Promise<Ceramic> => {
    c.anchorOnRequest = false // Config option for InMemoryAnchorService
    c.verifySignatures = false // Config option for InMemoryAnchorService
    c.restoreDocuments = false
    const ceramic = await Ceramic.create(ipfs, c)

    await ceramic.setDID(makeDID(seed))
    await ceramic.did.authenticate()
    return ceramic
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
    let validateLinkSpy

    beforeEach(async () => {
      ceramic = await createCeramic()
      authProvider = { createLink: jest.fn() }
      const caip10handler = ceramic._doctypeHandlers.get(Caip10LinkDoctype.DOCTYPE_NAME)
      validateLinkSpy = jest.spyOn(caip10handler, "_validateLink")
      validateLinkSpy.mockImplementation(async (proof) => { return proof })
    })

    afterEach(async () => {
      await ceramic.close()
    })

    it('Create from valid account id', async () => {
      const account = '0x0123456789abcdefghijklmnopqrstuvwxyz0000@eip155:1'
      const link = await Caip10LinkDoctype.fromAccount(ceramic, account, { anchor: false })
      expect(link.metadata.controllers).toHaveLength(1)
      expect(link.metadata.controllers[0]).toEqual(account)
      expect(link.content).toBeNull()
      expect(link.state.log).toHaveLength(1)
      expect(link.state).toMatchSnapshot()
    })

    it('invalid account id', async () => {
      const invalid1 = '0x0123456789abcdefghijklmnopqrstuvwxyz0000'
      const invalid2 = '0x0123456789abcdefghijklmnopqrstuvwxyz0000@eip155'
      const invalid3 = '@eip155:1'
      await expect(Caip10LinkDoctype.fromAccount(ceramic, invalid1, { anchor: false })).rejects.toThrow(/Invalid accountId provided/)
      await expect(Caip10LinkDoctype.fromAccount(ceramic, invalid2, { anchor: false })).rejects.toThrow(/Invalid chainId provided/)
      await expect(Caip10LinkDoctype.fromAccount(ceramic, invalid3, { anchor: false })).rejects.toThrow(/Invalid accountId provided/)
    })

    it('Create and link DID', async () => {
      const account = '0x0123456789abcdefghijklmnopqrstuvwxyz0001@eip155:1'
      const linkProof = { account, did: ceramic.did.id }
      authProvider.createLink.mockReturnValueOnce(linkProof)

      const link = await Caip10LinkDoctype.fromAccount(ceramic, account, { anchor: false })
      await link.setDid(ceramic.did, authProvider, { anchor: false })

      expect(link.content).toEqual(ceramic.did.id)
      expect(link.state.log).toHaveLength(2)
      expect(authProvider.createLink).toHaveBeenCalledTimes(1)
      expect(validateLinkSpy).toHaveBeenCalledTimes(1)
      expect(link.state).toMatchSnapshot()
    })

    it('Created with same address loads same doc', async () => {
      const account = '0x0123456789abcdefghijklmnopqrstuvwxyz0002@eip155:1'
      const linkProof = { account, did: ceramic.did.id }
      authProvider.createLink.mockReturnValueOnce(linkProof)

      const link1 = await Caip10LinkDoctype.fromAccount(ceramic, account, { anchor: false })
      await link1.setDid(ceramic.did, authProvider, { anchor: false })

      const link2 = await Caip10LinkDoctype.fromAccount(ceramic, account, { anchor: false })
      expect(link1.id).toEqual(link2.id)
      expect(link1.content).toEqual(ceramic.did.id)
      expect(link2.content).toEqual(link1.content)
      expect(DoctypeUtils.serializeState(link2.state)).toEqual(DoctypeUtils.serializeState(link1.state))
    })

    it('Load works', async () => {
      const account = '0x0123456789abcdefghijklmnopqrstuvwxyz0003@eip155:1'
      const linkProof = { account, did: ceramic.did.id }
      authProvider.createLink.mockReturnValueOnce(linkProof)

      const link1 = await Caip10LinkDoctype.fromAccount(ceramic, account, { anchor: false })
      await link1.setDid(ceramic.did, authProvider, { anchor: false })

      const link2 = await Caip10LinkDoctype.load(ceramic, link1.id)
      expect(link1.id).toEqual(link2.id)
      expect(link1.content).toEqual(ceramic.did.id)
      expect(link2.content).toEqual(link1.content)
      expect(DoctypeUtils.serializeState(link2.state)).toEqual(DoctypeUtils.serializeState(link1.state))
    })

    it('Anchoring works', async () => {
      const account = '0x0123456789abcdefghijklmnopqrstuvwxyz0004@eip155:1'
      const linkProof = { account, did: ceramic.did.id }
      authProvider.createLink.mockReturnValueOnce(linkProof)

      const link = await Caip10LinkDoctype.fromAccount(ceramic, account, { anchor: true })
      expect(link.state.anchorStatus).toEqual(AnchorStatus.PENDING)
      await anchorUpdate(ceramic, link)
      expect(link.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      await link.setDid(ceramic.did, authProvider, { anchor: true })
      expect(link.state.anchorStatus).toEqual(AnchorStatus.PENDING)
      await anchorUpdate(ceramic, link)
      expect(link.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      expect(link.content).toEqual(ceramic.did.id)
      expect(link.state.log).toHaveLength(4)
      expect(link.state).toMatchSnapshot()
    })

  })
})
