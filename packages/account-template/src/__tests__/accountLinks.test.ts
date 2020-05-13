jest.mock('3id-blockchain-utils', () => ({
  createLink: jest.fn()
}))

import AccountLinks from '../accountLinks'

import { createLink } from '3id-blockchain-utils'
import { buildMockCeramic, buildMockCeramicDoc } from './helpers'

describe('AccountLinks', () => {
  describe('load', () => {
    it('should load the account links tile with the given id along with existing account link documents', async () => {
      const docId = '/ceramic/abcdfg'
      const accountLinkDocIds = ['/ceramic/qwerty', '/ceramic/asdfg']
      const mockCeramicDoc = buildMockCeramicDoc()
      mockCeramicDoc.state.owners = ['0x12345@eip155:1']
      mockCeramicDoc.content = accountLinkDocIds
      const mockCeramic = buildMockCeramic()
      mockCeramic.loadDocument.mockResolvedValue(mockCeramicDoc)

      await AccountLinks.load(docId, mockCeramic)

      expect(mockCeramic.loadDocument).toHaveBeenCalledWith(docId)
      for (const accountLinkDocId of accountLinkDocIds) {
        expect(mockCeramic.loadDocument).toHaveBeenCalledWith(accountLinkDocId)
      }
    })
  })

  describe('build', () => {
    it('should create an account links tile', async () => {
      const owner = 'did:3:abcdefg'
      const mockAccountLinksTile = buildMockCeramicDoc()
      mockAccountLinksTile.content = []
      const mockCeramic = buildMockCeramic()
      mockCeramic.createDocument.mockResolvedValue(mockAccountLinksTile)

      await AccountLinks.build(owner, mockCeramic)

      expect(mockCeramic.createDocument).toHaveBeenCalledWith([], 'tile', { owners: [owner] })
    })
  })

  describe('getLinkedAddresses', () => {
    it('should return all addresses linked to this account', async () => {
      const mockAccountLinkDoc1 = buildMockCeramicDoc()
      mockAccountLinkDoc1.id = '/ceramic/qwerty'
      mockAccountLinkDoc1.state.owners = ['0x12345@eip155:1']
      const mockAccountLinkDoc2 = buildMockCeramicDoc()
      mockAccountLinkDoc2.id = '/ceramic/asdfg'
      mockAccountLinkDoc2.state.owners = ['0xabcde@eip155:1']
      const mockAccountLinksTile = buildMockCeramicDoc()
      mockAccountLinksTile.id = '/ceramic/zxcvb'
      mockAccountLinksTile.content = [mockAccountLinkDoc1.id, mockAccountLinkDoc2.id]
      const mockCeramic = buildMockCeramic([mockAccountLinksTile, mockAccountLinkDoc1, mockAccountLinkDoc2])
      const accountLinks = await AccountLinks.load(mockAccountLinksTile.id, mockCeramic)

      const linkedAddresses = accountLinks.getLinkedAddresses()

      expect(linkedAddresses).toEqual(expect.arrayContaining([mockAccountLinkDoc1.state.owners[0], mockAccountLinkDoc2.state.owners[0]]))
    })
  })

  describe('linkAddress', () => {
    it('should create and link an account-link document to the given address', async () => {
      const did = 'did:3:abcdfg'
      const address = '0x12345@eip155:1'
      const mockAccountLinksTile = buildMockCeramicDoc()
      mockAccountLinksTile.content = []
      mockAccountLinksTile.state.owners = [did]
      const mockAccountLinkDoc = buildMockCeramicDoc()
      mockAccountLinkDoc.id = '/ceramic/qwerty'
      const mockCeramic = buildMockCeramic()
      mockCeramic.createDocument.mockResolvedValue(mockAccountLinkDoc)
      const mockProvider = jest.fn()
      const accountLinks = new AccountLinks(mockAccountLinksTile, mockCeramic, mockProvider)
      const mockProof = jest.fn()
      createLink.mockResolvedValue(mockProof)

      await accountLinks.linkAddress(address)

      expect(createLink).toHaveBeenCalledWith(did, address, mockProvider)
      expect(mockCeramic.createDocument).toHaveBeenCalledWith(null, 'account-link', {
        owners: [address],
        onlyGenesis: true
      })
      expect(mockAccountLinkDoc.change).toHaveBeenCalledWith(mockProof)
      expect(mockAccountLinksTile.change).toHaveBeenCalledWith([mockAccountLinkDoc.id])
    })

    it('should create and link an account-link document to the given address, converting to CAIP-10 format', async () => {
      const did = 'did:3:abcdfg'
      const address = '0x12345'
      const mockAccountLinksTile = buildMockCeramicDoc()
      mockAccountLinksTile.content = []
      mockAccountLinksTile.state.owners = [did]
      const mockAccountLinkDoc = buildMockCeramicDoc()
      mockAccountLinkDoc.id = '/ceramic/qwerty'
      const mockCeramic = buildMockCeramic()
      mockCeramic.createDocument.mockResolvedValue(mockAccountLinkDoc)
      const mockProvider = jest.fn()
      const netVersion = 1
      mockProvider.send = jest.fn((_, cb) => cb(null, { result: netVersion }))
      const accountLinks = new AccountLinks(mockAccountLinksTile, mockCeramic, mockProvider)
      const mockProof = jest.fn()
      createLink.mockResolvedValue(mockProof)

      await accountLinks.linkAddress(address)

      const expectAddress = address + '@eip155:' + netVersion
      expect(mockCeramic.createDocument).toHaveBeenCalledWith(null, 'account-link', {
        owners: [expectAddress],
        onlyGenesis: true
      })
    })

    it('should create and link an account-link document with the given proof if provided', async () => {
      const did = 'did:3:abcdfg'
      const address = '0x12345@eip155:1'
      const mockAccountLinksTile = buildMockCeramicDoc()
      mockAccountLinksTile.content = []
      mockAccountLinksTile.state.owners = [did]
      const mockAccountLinkDoc = buildMockCeramicDoc()
      mockAccountLinkDoc.id = '/ceramic/qwerty'
      const mockCeramic = buildMockCeramic()
      mockCeramic.createDocument.mockResolvedValue(mockAccountLinkDoc)
      const accountLinks = new AccountLinks(mockAccountLinksTile, mockCeramic)
      const mockProof = jest.fn()

      await accountLinks.linkAddress(address, mockProof)

      expect(createLink).not.toHaveBeenCalledWith()
      expect(mockCeramic.createDocument).toHaveBeenCalledWith(null, 'account-link', {
        owners: [address],
        onlyGenesis: true
      })
      expect(mockAccountLinkDoc.change).toHaveBeenCalledWith(mockProof)
      expect(mockAccountLinksTile.change).toHaveBeenCalledWith([mockAccountLinkDoc.id])
    })

    it('should throw an error if the address is already linked', async () => {
      const did = 'did:3:abcdfg'
      const address = '0x12345@eip155:1'
      const mockAccountLinksTile = buildMockCeramicDoc()
      mockAccountLinksTile.content = []
      mockAccountLinksTile.state.owners = [did]
      const mockAccountLinkDoc = buildMockCeramicDoc()
      mockAccountLinkDoc.id = '/ceramic/qwerty'
      const mockCeramic = buildMockCeramic()
      mockCeramic.createDocument.mockResolvedValue(mockAccountLinkDoc)
      const mockProvider = jest.fn()
      const accountLinks = new AccountLinks(mockAccountLinksTile, mockCeramic, mockProvider)
      const mockProof = jest.fn()
      createLink.mockResolvedValue(mockProof)
      await accountLinks.linkAddress(address)

      await expect(accountLinks.linkAddress(address)).rejects.toThrow(/Address .* already linked/i)
    })
  })

  describe('unlinkAddress', () => {
    it('should remove the account link document for the given address', async () => {
      const did = 'did:3:abcdfg'
      const address = '0x12345@eip155:1'
      const mockAccountLinksTile = buildMockCeramicDoc()
      mockAccountLinksTile.content = []
      mockAccountLinksTile.state.owners = [did]
      const mockAccountLinkDoc = buildMockCeramicDoc()
      mockAccountLinkDoc.id = '/ceramic/qwerty'
      const mockCeramic = buildMockCeramic()
      mockCeramic.createDocument.mockResolvedValue(mockAccountLinkDoc)
      const mockProvider = jest.fn()
      const accountLinks = new AccountLinks(mockAccountLinksTile, mockCeramic, mockProvider)
      const mockProof = jest.fn()
      createLink.mockResolvedValue(mockProof)
      await accountLinks.linkAddress(address)
      expect(accountLinks.getLinkedAddresses()).toContain(address)

      await accountLinks.unlinkAddress(address)

      expect(accountLinks.getLinkedAddresses()).not.toContain(address)
      expect(mockAccountLinksTile.change).toHaveBeenCalledWith([])
    })

    it('should clear the account link document and the reference to it for the given address, converting to CAIP-10 format', async () => {
      const did = 'did:3:abcdfg'
      const address = '0x12345'
      const caip10Address = address + '@eip155:1'
      const mockAccountLinksTile = buildMockCeramicDoc()
      mockAccountLinksTile.content = []
      mockAccountLinksTile.state.owners = [did]
      const mockAccountLinkDoc = buildMockCeramicDoc()
      mockAccountLinkDoc.id = '/ceramic/qwerty'
      const mockCeramic = buildMockCeramic()
      mockCeramic.createDocument.mockResolvedValue(mockAccountLinkDoc)
      const mockProvider = jest.fn()
      const netVersion = 1
      mockProvider.send = jest.fn((_, cb) => cb(null, { result: netVersion }))
      const accountLinks = new AccountLinks(mockAccountLinksTile, mockCeramic, mockProvider)
      const mockProof = jest.fn()
      createLink.mockResolvedValue(mockProof)
      await accountLinks.linkAddress(caip10Address)
      expect(accountLinks.getLinkedAddresses()).toContain(caip10Address)

      await accountLinks.unlinkAddress(address) 

      expect(accountLinks.getLinkedAddresses()).not.toContain(caip10Address)
    })

    it('should throw an error if the address is not linked', async () => {
      const did = 'did:3:abcdfg'
      const address = '0x12345@eip155:1'
      const mockAccountLinksTile = buildMockCeramicDoc()
      mockAccountLinksTile.content = []
      mockAccountLinksTile.state.owners = [did]
      const mockCeramic = buildMockCeramic()
      const mockProvider = jest.fn()
      const accountLinks = new AccountLinks(mockAccountLinksTile, mockCeramic, mockProvider)

      await expect(accountLinks.unlinkAddress(address)).rejects.toThrow(/Address .* not linked/i)
    })
  })
})