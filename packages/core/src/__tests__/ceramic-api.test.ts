import Ceramic, { CeramicConfig } from '../ceramic'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import IPFS from 'ipfs-core'
import tmp from 'tmp-promise'
import { TileDoctype, TileParams } from "@ceramicnetwork/doctype-tile"
import { AnchorStatus, DoctypeUtils, IpfsApi } from "@ceramicnetwork/common"

import dagJose from 'dag-jose'
import basicsImport from 'multiformats/cjs/src/basics-import.js'
import legacy from 'multiformats/cjs/src/legacy.js'
import DocID from '@ceramicnetwork/docid'
import * as u8a from 'uint8arrays'
import cloneDeep from 'lodash.clonedeep'

jest.mock('../store/level-state-store')

const seed = u8a.fromString('6e34b2e1a9624113d81ece8a8a22e6e97f0e145c25c1d4d2d0e62753b4060c83', 'base16')

/**
 * Create an IPFS instance
 * @param overrideConfig - IFPS config for override
 */
const createIPFS =(overrideConfig: Record<string, unknown> = {}): Promise<IpfsApi> => {
  basicsImport.multicodec.add(dagJose)
  const format = legacy(basicsImport, dagJose.name)

  const config = {
    ipld: { formats: [format] },
  }

  Object.assign(config, overrideConfig)
  return IPFS.create(config)
}

const registerChangeListener = function (doc: any): Promise<void> {
  return new Promise(resolve => {
    doc.on('change', () => {
      resolve()
    })
  })
}

/**
 * Registers a listener for change notifications on a document, instructs the anchor service to
 * perform an anchor, then waits for the change listener to resolve, indicating that the document
 * got anchored.
 * @param ceramic
 * @param doc
 */
const anchorDoc = async (ceramic: Ceramic, doc: any): Promise<void> => {
  const changeHandle = registerChangeListener(doc)
  await ceramic.context.anchorService.anchor()
  await changeHandle
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
    c.anchorOnRequest = false
    const ceramic = await Ceramic.create(ipfs, c)

    const provider = new Ed25519Provider(seed)
    await ceramic.setDIDProvider(provider)
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
      await anchorDoc(ceramic, docOg)

      expect(docOg.state.log.length).toEqual(2)
      expect(docOg.content).toEqual({ test: 321 })
      expect(docOg.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      const stateOg = docOg.state

      await docOg.change({ content: { test: 'abcde' } })

      // wait for anchor (new version)
      await anchorDoc(ceramic, docOg)

      expect(docOg.state.log.length).toEqual(4)
      expect(docOg.content).toEqual({ test: 'abcde' })
      expect(docOg.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      let docV0Id = DocID.fromBytes(docOg.id.bytes, docOg.state.log[1].cid.toString())
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
        expect(e.message).toEqual('Historical document versions cannot be modified. Load the document without specifying a version to make updates.')
      }

      // // try to call Ceramic API directly
      try {
        const updateRecord = await TileDoctype._makeRecord(docV0, ceramic.context.did, { content: { test: 'fghj' } })
        await ceramic.context.api.applyRecord(docV0Id, updateRecord)
        throw new Error('Should not be able to update version')
      } catch (e) {
        expect(e.message).toEqual('Historical document versions cannot be modified. Load the document without specifying a version to make updates.')
      }

      // try to checkout not anchored version
      try {
        docV0Id = DocID.fromBytes(docOg.id.bytes, docOg.state.log[2].cid.toString())
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
          schema: schemaDoc.versionId.toString(), controllers: [controller]
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
          schema: schemaDoc.versionId.toString(), controllers: [controller]
        }, content: { a: "test" }
      }

      await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, tileDocParams)

      await new Promise(resolve => setTimeout(resolve, 1000)) // wait to propagate
      await ceramic.close()
    })

    it('Must assign schema with specific version', async () => {
      ceramic = await createCeramic()

      const controller = ceramic.context.did.id

      const schemaDoc = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, {
        content: stringMapSchema,
        metadata: { controllers: [controller] }
      })

      expect(schemaDoc.id.version).toBeFalsy()
      const schemaDocIdWithoutVersion = schemaDoc.id.toString()
      const tileDocParams: TileParams = {
        metadata: {
          schema: schemaDocIdWithoutVersion, controllers: [controller]
        }, content: { a: "test" }
      }

      try {
        await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, tileDocParams)
        throw new Error("Should not be able to assign a schema without specifying the schema version")
      } catch (e) {
        expect(e.message).toEqual("Version missing when loading schema document")
      }

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
          schema: schemaDoc.versionId.toString(), controllers: [controller]
        }, content: { a: 1 },
      }

      await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, tileDocParams)

      await new Promise(resolve => setTimeout(resolve, 1000)) // wait to propagate
      await ceramic.close()
    })

    it('can assign schema if content is valid', async () => {
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
          controllers: [controller], schema: schemaDoc.versionId.toString()
        }
      })

      expect(doctype.content).toEqual({ a: 'x' })
      expect(doctype.metadata.schema).toEqual(schemaDoc.versionId.toString())

      await new Promise(resolve => setTimeout(resolve, 1000)) // wait to propagate
      await ceramic.close()
    })

    it('cannot assign schema if content is not valid', async () => {
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
            controllers: [controller], schema: schemaDoc.versionId.toString()
          }
        })
        throw new Error('Should not be able to update the document with invalid content')
      } catch (e) {
        expect(e.message).toEqual('Validation Error: data[\'a\'] should be string')
      }

      await ceramic.close()
    })

    it('can update valid content and assign schema at the same time', async () => {
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
          controllers: [controller], schema: schemaDoc.versionId.toString()
        }
      })

      expect(doctype.content).toEqual({ a: 'x' })

      await new Promise(resolve => setTimeout(resolve, 1000)) // wait to propagate
      await ceramic.close()
    })

    it('can update schema and then assign to doc with now valid content', async () => {
      ceramic = await createCeramic()

      const controller = ceramic.context.did.id

      // Create doc with content that has type 'number'.
      const tileDocParams: TileParams = {
        metadata: {
          controllers: [controller]
        },
        content: { a: 1 },
      }
      const doc = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, tileDocParams)
      await anchorDoc(ceramic, doc)

      // Create schema that enforces that the content value is a string, which would reject
      // the document created above.
      const schemaDoc = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, {
        content: stringMapSchema,
        metadata: { controllers: [controller] }
      })
      // wait for anchor
      await anchorDoc(ceramic, schemaDoc)
      expect(schemaDoc.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      // Update the schema to expect a number, so now the original doc should conform to the new
      // version of the schema
      const updatedSchema = cloneDeep(stringMapSchema)
      updatedSchema.additionalProperties.type = "number"
      await schemaDoc.change({content: updatedSchema})
      // wait for anchor
      await anchorDoc(ceramic, schemaDoc)
      expect(schemaDoc.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      // Test that we can assign the updated schema to the document without error.
      await doc.change({
        metadata: {
          controllers: [controller], schema: schemaDoc.versionId.toString()
        }
      })
      await anchorDoc(ceramic, doc)
      expect(doc.content).toEqual({ a: 1 })

      // Test that we can reload the document without issue
      const doc2 = await ceramic.loadDocument(doc.id)
      expect(doc2.content).toEqual(doc.content)
      expect(doc2.metadata).toEqual(doc.metadata)

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
      for (const { cid } of doctype.state.log) {
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
