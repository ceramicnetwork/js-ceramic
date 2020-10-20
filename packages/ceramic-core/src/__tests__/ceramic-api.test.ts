import Ceramic, { CeramicConfig } from '../ceramic'
import IdentityWallet from 'identity-wallet'
import Ipfs from 'ipfs'
import tmp from 'tmp-promise'
import { TileDoctype, TileParams } from "@ceramicnetwork/ceramic-doctype-tile"
import { AnchorStatus, DoctypeUtils } from "@ceramicnetwork/ceramic-common"

import dagJose from 'dag-jose'
import basicsImport from 'multiformats/cjs/src/basics-import.js'
import legacy from 'multiformats/cjs/src/legacy.js'
import DocID from '@ceramicnetwork/docid'

jest.mock('../store/level-state-store')

const seed = '0x5872d6e0ae7347b72c9216db218ebbb9d9d0ae7ab818ead3557e8e78bf944184'

/**
 * Create an IPFS instance
 * @param overrideConfig - IFPS config for override
 */
const createIPFS =(overrideConfig: object = {}): Promise<any> => {
  basicsImport.multicodec.add(dagJose)
  const format = legacy(basicsImport, dagJose.name)

  const config = {
    ipld: { formats: [format] },
  }

  Object.assign(config, overrideConfig)
  return Ipfs.create(config)
}


describe('Ceramic API', () => {
  jest.setTimeout(15000)
  let ipfs: Ipfs;
  let ceramic: Ceramic
  let tmpFolder: any;

  const DOCTYPE_TILE = 'tile'

  const topic = '/ceramic_api_test'

  const stringMapSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "StringMap",
    "type": "object",
    "additionalProperties": {
      "type": "string"
    }
  }

  const createCeramic = async (c: CeramicConfig = {}): Promise<Ceramic> => {
    c.topic = topic
    const ceramic = await Ceramic.create(ipfs, c)

    const config = {
      getPermission: async (): Promise<Array<string>> => [],
      seed,
      ceramic: ceramic,
      disableIDX: true,
    }
    await IdentityWallet.create(config)
    return ceramic
  }

  beforeAll(async () => {
    tmpFolder = await tmp.dir({ unsafeCleanup: true })

    ipfs = await createIPFS({
      repo: `${tmpFolder.path}`,
      config: {
        Addresses: { Swarm: [ `/ip4/127.0.0.1/tcp/${3001}` ] },
        Bootstrap: []
      }
    })
  })

  afterAll(async () => {
    await ipfs.stop(() => console.log('IPFS stopped'))
    await tmpFolder.cleanup()
  })

  describe('API', () => {
    it('can load the previous document version', async () => {
      ceramic = await createCeramic()

      const owner = ceramic.context.did.id

      const docOg = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, {
        content: { test: 321 },
        metadata: { owners: [owner] }
      })

      // wait for anchor (new version)
      await new Promise(resolve => {
        docOg.on('change', () => {
          resolve()
        })
      })

      expect(docOg.state.log.length).toEqual(2)
      expect(docOg.content).toEqual({ test: 321 })
      expect(docOg.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      const stateOg = docOg.state

      await docOg.change({ content: { test: 'abcde' } })

      // wait for anchor (new version)
      await new Promise(resolve => {
        docOg.on('change', () => {
          resolve()
        })
      })

      expect(docOg.state.log.length).toEqual(4)
      expect(docOg.content).toEqual({ test: 'abcde' })
      expect(docOg.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      let docV0Id = DocID.fromBytes(docOg.id.bytes, docOg.state.log[1].toString())
      console.log(docV0Id)
      const docV0 = await ceramic.loadDocument<TileDoctype>(docV0Id)

      expect(docV0.state).toEqual(stateOg)
      expect(docV0.content).toEqual({ test: 321 })
      expect(docV0.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      // try to call doctype.change
      try {
        await docV0.change({ content: { test: 'fghj' }, metadata: { owners: docV0.owners } })
        throw new Error('Should not be able to update version')
      } catch (e) {
        expect(e.message).toEqual('The version of the document is readonly. Checkout the latest HEAD in order to update.')
      }

      // // try to call Ceramic API directly
      try {
        const updateRecord = await TileDoctype._makeRecord(docV0, ceramic.context.did, { content: { test: 'fghj' } })
        await ceramic.context.api.applyRecord(docV0Id, updateRecord)
        throw new Error('Should not be able to update version')
      } catch (e) {
        expect(e.message).toEqual('The version of the document is readonly. Checkout the latest HEAD in order to update.')
      }

      // try to checkout not anchored version
      try {
        docV0Id = DocID.fromBytes(docOg.id.bytes, docOg.state.log[2].toString())
        await ceramic.loadDocument<TileDoctype>(docV0Id)
        throw new Error('Should not be able to fetch not anchored version')
      } catch (e) {
        expect(e.message).toContain('No anchor record for version')
      }

      await ceramic.close()
    })

    it('cannot create document with invalid schema', async () => {
      ceramic = await createCeramic()

      const owner = ceramic.context.did.id

      const schemaDoc = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, {
        content: stringMapSchema,
        metadata: { owners: [owner] }
      })

      const tileDocParams: TileParams = {
        metadata: {
          schema: schemaDoc.id.toString(), owners: [owner]
        }, content: { a: 1 },
      }

      try {
        await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, tileDocParams)
        throw new Error('Should not be able to create an invalid document')
      } catch (e) {
        console.log(e)
        expect(e.message).toEqual('Validation Error: data[\'a\'] should be string')
      }

      await ceramic.close()
    })

    it('can create document with valid schema', async () => {
      ceramic = await createCeramic()

      const owner = ceramic.context.did.id

      const schemaDoc = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, {
        content: stringMapSchema,
        metadata: { owners: [owner] }
      })

      const tileDocParams: TileParams = {
        metadata: {
          schema: schemaDoc.id.toString(), owners: [owner]
        }, content: { a: "test" }
      }

      await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, tileDocParams)

      await new Promise(resolve => setTimeout(resolve, 1000)) // wait to propagate
      await ceramic.close()
    })

    it('can create document with invalid schema if validation is not set', async () => {
      ceramic = await createCeramic({ validateDocs: false })

      const owner = ceramic.context.did.id

      const schemaDoc = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, {
        content: stringMapSchema,
        metadata: { owners: [owner] }
      })

      const tileDocParams: TileParams = {
        metadata: {
          schema: schemaDoc.id.toString(), owners: [owner]
        }, content: { a: 1 },
      }

      await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, tileDocParams)

      await new Promise(resolve => setTimeout(resolve, 1000)) // wait to propagate
      await ceramic.close()
    })

    it('can update schema if content is valid', async () => {
      ceramic = await createCeramic()

      const owner = ceramic.context.did.id

      const tileDocParams: TileParams = {
        metadata: {
          owners: [owner]
        }, content: { a: 'x' },
      }

      const doctype = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, tileDocParams)
      const schemaDoc = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, {
        content: stringMapSchema, metadata: {
          owners: [owner]
        }
      })

      await doctype.change({
        metadata: {
          owners: [owner], schema: schemaDoc.id.toString()
        }
      })

      expect(doctype.content).toEqual({ a: 'x' })

      await new Promise(resolve => setTimeout(resolve, 1000)) // wait to propagate
      await ceramic.close()
    })

    it('cannot update schema if content is not valid', async () => {
      ceramic = await createCeramic()

      const owner = ceramic.context.did.id

      const tileDocParams: TileParams = {
        metadata: {
          owners: [owner]
        }, content: { a: 1 },
      }

      const doctype = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, tileDocParams)
      const schemaDoc = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, {
        content: stringMapSchema, metadata: {
          owners: [owner]
        }
      })

      try {
        await doctype.change({
          metadata: {
            owners: [owner], schema: schemaDoc.id.toString()
          }
        })
        throw new Error('Should not be able to update the document with invalid content')
      } catch (e) {
        expect(e.message).toEqual('Validation Error: data[\'a\'] should be string')
      }

      await ceramic.close()
    })

    it('can update valid content and schema at the same time', async () => {
      ceramic = await createCeramic()

      const owner = ceramic.context.did.id

      const tileDocParams: TileParams = {
        metadata: {
          owners: [owner]
        }, content: { a: 1 },
      }

      const doctype = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, tileDocParams)
      const schemaDoc = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, {
        content: stringMapSchema, metadata: {
          owners: [owner]
        }
      })

      await doctype.change({
        content: { a: 'x' }, metadata: {
          owners: [owner], schema: schemaDoc.id.toString()
        }
      })

      expect(doctype.content).toEqual({ a: 'x' })

      await new Promise(resolve => setTimeout(resolve, 1000)) // wait to propagate
      await ceramic.close()
    })

    it('can list log records', async () => {
      ceramic = await createCeramic()

      const owner = ceramic.context.did.id

      const tileDocParams: TileParams = {
        metadata: {
          owners: [owner]
        }, content: { a: 1 },
      }

      const doctype = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, tileDocParams)
      const logRecords = await ceramic.loadDocumentRecords(doctype.id)
      expect(logRecords).toBeDefined()

      const expected = []
      for (const cid of doctype.state.log) {
        const record = (await ceramic.ipfs.dag.get(cid)).value
        expected.push({
          cid: cid.toString(),
          value: await DoctypeUtils.convertRecordToDTO(record, ipfs)
        })
      }

      expect(logRecords).toEqual(expected)
      await ceramic.close()
    })
  })

})
