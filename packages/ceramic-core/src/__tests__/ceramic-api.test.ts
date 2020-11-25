import Ceramic, { CeramicConfig } from '../ceramic'
import IdentityWallet from 'identity-wallet'
import IPFS from 'ipfs'
import tmp from 'tmp-promise'
import { TileDoctype, TileParams } from "@ceramicnetwork/ceramic-doctype-tile"
import { AnchorStatus, DoctypeUtils, IpfsApi } from "@ceramicnetwork/ceramic-common"

import dagJose from 'dag-jose'
import basicsImport from 'multiformats/cjs/src/basics-import.js'
import legacy from 'multiformats/cjs/src/legacy.js'
import DocID from '@ceramicnetwork/docid'
import * as u8a from 'uint8arrays'

jest.mock('../store/level-state-store')

const seed = u8a.fromString('6e34b2e1a9624113d81ece8a8a22e6e97f0e145c25c1d4d2d0e62753b4060c837097f768559e17ec89ee20cba153b23b9987912ec1e860fa1212ba4b84c776ce', 'base16')

/**
 * Create an IPFS instance
 * @param overrideConfig - IFPS config for override
 */
const createIPFS =(overrideConfig: Record<string, unknown> = {}): Promise<any> => {
  basicsImport.multicodec.add(dagJose)
  const format = legacy(basicsImport, dagJose.name)

  const config = {
    ipld: { formats: [format] },
  }

  Object.assign(config, overrideConfig)
  return IPFS.create(config)
}


describe('Ceramic API', () => {
  jest.setTimeout(15000)
  let ipfs: IpfsApi;
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

      const controller = ceramic.context.did.id

      const docOg = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, {
        content: { test: 321 },
        metadata: { controllers: [controller] }
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
        await docV0.change({ content: { test: 'fghj' }, metadata: { controllers: docV0.controllers } })
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

      const controller = ceramic.context.did.id

      const schemaDoc = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, {
        content: stringMapSchema,
        metadata: { controllers: [controller] }
      })

      const tileDocParams: TileParams = {
        metadata: {
          schema: schemaDoc.id.toString(), controllers: [controller]
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

      const controller = ceramic.context.did.id

      const schemaDoc = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, {
        content: stringMapSchema,
        metadata: { controllers: [controller] }
      })

      const tileDocParams: TileParams = {
        metadata: {
          schema: schemaDoc.id.toString(), controllers: [controller]
        }, content: { a: "test" }
      }

      await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, tileDocParams)

      await new Promise(resolve => setTimeout(resolve, 1000)) // wait to propagate
      await ceramic.close()
    })

    it('can create document with invalid schema if validation is not set', async () => {
      ceramic = await createCeramic({ validateDocs: false })

      const controller = ceramic.context.did.id

      const schemaDoc = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, {
        content: stringMapSchema,
        metadata: { controllers: [controller] }
      })

      const tileDocParams: TileParams = {
        metadata: {
          schema: schemaDoc.id.toString(), controllers: [controller]
        }, content: { a: 1 },
      }

      await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, tileDocParams)

      await new Promise(resolve => setTimeout(resolve, 1000)) // wait to propagate
      await ceramic.close()
    })

    it('can update schema if content is valid', async () => {
      ceramic = await createCeramic()

      const controller = ceramic.context.did.id

      const tileDocParams: TileParams = {
        metadata: {
          controllers: [controller]
        }, content: { a: 'x' },
      }

      const doctype = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, tileDocParams)
      const schemaDoc = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, {
        content: stringMapSchema, metadata: {
          controllers: [controller]
        }
      })

      await doctype.change({
        metadata: {
          controllers: [controller], schema: schemaDoc.id.toString()
        }
      })

      expect(doctype.content).toEqual({ a: 'x' })

      await new Promise(resolve => setTimeout(resolve, 1000)) // wait to propagate
      await ceramic.close()
    })

    it('cannot update schema if content is not valid', async () => {
      ceramic = await createCeramic()

      const controller = ceramic.context.did.id

      const tileDocParams: TileParams = {
        metadata: {
          controllers: [controller]
        }, content: { a: 1 },
      }

      const doctype = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, tileDocParams)
      const schemaDoc = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, {
        content: stringMapSchema, metadata: {
          controllers: [controller]
        }
      })

      try {
        await doctype.change({
          metadata: {
            controllers: [controller], schema: schemaDoc.id.toString()
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

      const controller = ceramic.context.did.id

      const tileDocParams: TileParams = {
        metadata: {
          controllers: [controller]
        }, content: { a: 1 },
      }

      const doctype = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, tileDocParams)
      const schemaDoc = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, {
        content: stringMapSchema, metadata: {
          controllers: [controller]
        }
      })

      await doctype.change({
        content: { a: 'x' }, metadata: {
          controllers: [controller], schema: schemaDoc.id.toString()
        }
      })

      expect(doctype.content).toEqual({ a: 'x' })

      await new Promise(resolve => setTimeout(resolve, 1000)) // wait to propagate
      await ceramic.close()
    })

    it('can list log records', async () => {
      ceramic = await createCeramic()

      const controller = ceramic.context.did.id

      const tileDocParams: TileParams = {
        metadata: {
          controllers: [controller]
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
