import DIDDocument from '../did'

import { buildMockCeramic, buildMockCeramicDoc } from './helpers'

describe('DIDDocument', () => {
  describe('load', () => {
    it('should load a given 3ID based on an existing ceramic document', async () => {
      const cid = 'abcdfg'
      const did = 'did:3:' + cid
      const mockCeramicDoc = buildMockCeramicDoc()
      const mockCeramic = buildMockCeramic()
      mockCeramic.loadDocument.mockResolvedValue(mockCeramicDoc)
      
      const didDocument = await DIDDocument.load(did, mockCeramic)

      expect(mockCeramic.loadDocument).toHaveBeenCalledWith('/ceramic/' + cid)
      expect(didDocument.ceramicDoc).toEqual(mockCeramicDoc)
    })
    it("should throw an error if the did isn't a 3ID", async () => {
      const did = 'did:muport:abcdfg'
      const mockCeramic = buildMockCeramic()
      await expect(DIDDocument.load(did, mockCeramic)).rejects.toThrow(/Only 3IDs allowed/i)
    })
  })

  describe('build', () => {
    it('should create a new ceramic DID document with the provided keys', async () => {
      const keys = {
        managementKey: '02d41c913f542ae671e6df17a456c7dd6a280479d491120629daf92130602cd135',
        signingKey: '03e44c4e2a192daba57200aa6dd06dcfd38220a544fd1b3fe13862eb755dbc1b67',
        encryptionKey: 'XIL/mHYbKvT6GkiNBb4VU9IpNdKmkbaVJRRTfHmtuQI='
      }
      const mockCeramic = buildMockCeramic()
      mockCeramic.createDocument.mockResolvedValue()
      await DIDDocument.build(keys, mockCeramic)

      expect(mockCeramic.createDocument).toHaveBeenCalledWith({
        publicKeys: {
          signing: keys.signingKey,
          encryption: keys.encryptionKey
        }
      }, '3id', { owners: [keys.managementKey] })
    })
  })

  describe('setAccountTile', () => {
    it("should link to the given ceramic document in the 'account' property", async () => {
      const mockCeramicDoc = buildMockCeramicDoc()
      const mockCeramic = buildMockCeramic()
      const didDocument = new DIDDocument(mockCeramicDoc, mockCeramic)
      const mockAccountTile = buildMockCeramicDoc()
      mockAccountTile.id = '/ceramic/qwerty'

      await didDocument.setAccountTile(mockAccountTile)

      expect(mockCeramicDoc.change).toHaveBeenCalledWith({ ...mockCeramicDoc.content, account: mockAccountTile.id })
    })

    it('should throw an error if an account document is already linked to this DID', async () => {
      const mockCeramicDoc = buildMockCeramicDoc()
      const docId = '/ceramic/qwerty'
      mockCeramicDoc.content = { account: docId}
      const mockCeramic = buildMockCeramic()
      const didDocument = new DIDDocument(mockCeramicDoc, mockCeramic)
      const mockAccountTile = buildMockCeramicDoc()
      mockAccountTile.id = docId

      await expect(didDocument.setAccountTile(mockAccountTile)).rejects.toThrow(/Account tile already linked/i)
    })
  })
})