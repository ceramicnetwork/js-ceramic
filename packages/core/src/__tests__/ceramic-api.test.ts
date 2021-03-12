import Ceramic, { CeramicConfig } from '../ceramic'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import { TileDoctype, TileParams } from "@ceramicnetwork/doctype-tile"
import { AnchorStatus, DoctypeUtils, IpfsApi } from "@ceramicnetwork/common"
import DocID from '@ceramicnetwork/docid'
import * as u8a from 'uint8arrays'
import cloneDeep from 'lodash.clonedeep'
import { createIPFS } from './ipfs-util';

jest.mock('../store/level-state-store')

const seed = u8a.fromString('6e34b2e1a9624113d81ece8a8a22e6e97f0e145c25c1d4d2d0e62753b4060c83', 'base16')

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
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  await ceramic.context.anchorService.anchor()
  await changeHandle
}

/**
 * Generates string of particular size in bytes
 * @param size - Size in bytes
 */
const generateStringOfSize = (size): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const len = chars.length;
  const random_data = [];

  while (size--) {
    random_data.push(chars[Math.random() * len | 0]);
  }
  return random_data.join('');
}

describe('Ceramic API', () => {
  jest.setTimeout(60000)
  let ipfs: IpfsApi;

  const DOCTYPE_TILE = 'tile'

  const stringMapSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "StringMap",
    "type": "object",
    "additionalProperties": {
      "type": "string"
    }
  }

  const createCeramic = async (c: CeramicConfig = {}): Promise<Ceramic> => {
    c.anchorOnRequest = false
    c.restoreDocuments = false
    const ceramic = await Ceramic.create(ipfs, c)

    const provider = new Ed25519Provider(seed)
    await ceramic.setDIDProvider(provider)
    return ceramic
  }

  beforeAll(async () => {
    ipfs = await createIPFS()
  })

  afterAll(async () => {
    await ipfs.stop(() => console.log('IPFS stopped'))
  })

  describe('API', () => {
    let ceramic: Ceramic

    beforeEach(async () => {
      ceramic = await createCeramic()
    })

    afterEach(async () => {
      await ceramic.close()
    })

    it('can load the previous document commit', async () => {
      const controller = ceramic.context.did.id

      const docOg = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, {
        content: { test: 321 },
        metadata: { controllers: [controller] }
      })

      // wait for anchor (new commit)
      await anchorDoc(ceramic, docOg)

      expect(docOg.state.log.length).toEqual(2)
      expect(docOg.content).toEqual({ test: 321 })
      expect(docOg.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      const stateOg = docOg.state

      await docOg.change({ content: { test: 'abcde' } })

      // wait for anchor (new commit)
      await anchorDoc(ceramic, docOg)

      expect(docOg.state.log.length).toEqual(4)
      expect(docOg.content).toEqual({ test: 'abcde' })
      expect(docOg.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      const docV1Id = docOg.id.atCommit(docOg.state.log[1].cid)
      const docV1 = await ceramic.loadDocument<TileDoctype>(docV1Id)
      expect(docV1.state).toEqual(stateOg)
      expect(docV1.content).toEqual({ test: 321 })
      expect(docV1.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      // try to call doctype.change
      try {
        await docV1.change({ content: { test: 'fghj' }, metadata: { controllers: docV1.controllers } })
        throw new Error('Should not be able to update commit')
      } catch (e) {
        expect(e.message).toEqual('Historical document commits cannot be modified. Load the document without specifying a commit to make updates.')
      }

      await expect( async () => {
        const updateRecord = await TileDoctype._makeCommit(docV1, ceramic.context.did, { content: { test: 'fghj' } })
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await ceramic.context.api.applyRecord(docV1Id, updateRecord)
      }).rejects.toThrow(/Not DocID/)

      // checkout not anchored commit
      const docV2Id = docOg.id.atCommit(docOg.state.log[2].cid)
      const docV2 = await ceramic.loadDocument<TileDoctype>(docV2Id)
      expect(docV2.content).toEqual({ test: "abcde" })
      expect(docV2.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)
    })

    it('cannot create document with invalid schema', async () => {
      const controller = ceramic.context.did.id

      const schemaDoc = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, {
        content: stringMapSchema,
        metadata: { controllers: [controller] }
      })

      const tileDocParams: TileParams = {
        metadata: {
          schema: schemaDoc.commitId.toString(), controllers: [controller]
        }, content: { a: 1 },
      }

      try {
        await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, tileDocParams)
        throw new Error('Should not be able to create an invalid document')
      } catch (e) {
        console.log(e)
        expect(e.message).toEqual('Validation Error: data[\'a\'] should be string')
      }
    })

    it('can create document with valid schema', async () => {
      const controller = ceramic.context.did.id

      const schemaDoc = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, {
        content: stringMapSchema,
        metadata: { controllers: [controller] }
      })

      const tileDocParams: TileParams = {
        metadata: {
          schema: schemaDoc.commitId.toString(), controllers: [controller]
        }, content: { a: "test" }
      }

      await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, tileDocParams)

      await new Promise(resolve => setTimeout(resolve, 1000)) // wait to propagate
    })

    it('must assign schema with specific commit', async () => {
      const controller = ceramic.context.did.id

      const schemaDoc = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, {
        content: stringMapSchema,
        metadata: { controllers: [controller] }
      })

      const schemaDocIdWithoutCommit = schemaDoc.id.toString()
      const tileDocParams: TileParams = {
        metadata: {
          schema: schemaDocIdWithoutCommit, controllers: [controller]
        }, content: { a: "test" }
      }

      await expect(ceramic.createDocument(DOCTYPE_TILE, tileDocParams)).rejects.toThrow('Commit missing when loading schema document')
    })

    it('can create document with invalid schema if validation is not set', async () => {
      await ceramic.close()
      ceramic = await createCeramic({ validateDocs: false })

      const controller = ceramic.context.did.id

      const schemaDoc = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, {
        content: stringMapSchema,
        metadata: { controllers: [controller] }
      })

      const tileDocParams: TileParams = {
        metadata: {
          schema: schemaDoc.commitId.toString(), controllers: [controller]
        }, content: { a: 1 },
      }

      await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, tileDocParams)
    })

    it('can assign schema if content is valid', async () => {
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
          controllers: [controller], schema: schemaDoc.commitId.toString()
        }
      })

      expect(doctype.content).toEqual({ a: 'x' })
      expect(doctype.metadata.schema).toEqual(schemaDoc.commitId.toString())

      await new Promise(resolve => setTimeout(resolve, 1000)) // wait to propagate
    })

    it('cannot assign schema if content is not valid', async () => {
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
            controllers: [controller], schema: schemaDoc.commitId.toString()
          }
        })
        throw new Error('Should not be able to update the document with invalid content')
      } catch (e) {
        expect(e.message).toEqual('Validation Error: data[\'a\'] should be string')
      }
    })

    it('can update valid content and assign schema at the same time', async () => {
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
          controllers: [controller], schema: schemaDoc.commitId.toString()
        }
      })

      expect(doctype.content).toEqual({ a: 'x' })

      await new Promise(resolve => setTimeout(resolve, 1000)) // wait to propagate
    })

    it('can update schema and then assign to doc with now valid content', async () => {
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
      // commit of the schema
      const updatedSchema = cloneDeep(stringMapSchema)
      updatedSchema.additionalProperties.type = "number"
      await schemaDoc.change({content: updatedSchema})
      // wait for anchor
      await anchorDoc(ceramic, schemaDoc)
      expect(schemaDoc.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      // Test that we can assign the updated schema to the document without error.
      await doc.change({
        metadata: {
          controllers: [controller], schema: schemaDoc.commitId.toString()
        }
      })
      await anchorDoc(ceramic, doc)
      expect(doc.content).toEqual({ a: 1 })

      // Test that we can reload the document without issue
      const doc2 = await ceramic.loadDocument(doc.id)
      expect(doc2.content).toEqual(doc.content)
      expect(doc2.metadata).toEqual(doc.metadata)
    })

    it('can list log records', async () => {
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
          value: await DoctypeUtils.convertCommitToSignedCommitContainer(record, ipfs)
        })
      }

      expect(logRecords).toEqual(expected)
    })

    it('can store record if the size is lesser than the maximum size ~256KB', async () => {
      const doctype = await ceramic.createDocument('tile', { content: { test: generateStringOfSize(10000) } })
      expect(doctype).not.toBeNull();
    })

    it('cannot store record if the size is greated than the maximum size ~256KB', async () => {
      await expect(ceramic.createDocument('tile', { content: { test: generateStringOfSize(1000000) } })).rejects.toThrow(/exceeds the maximum block size of/)
    })
  })

  describe('API MultiQueries', () => {

    let ceramic: Ceramic
    let docA: TileDoctype, docB: TileDoctype, docC: TileDoctype, docD: TileDoctype, docE: TileDoctype, docF: TileDoctype
    const notExistDocId = DocID.fromString('kjzl6cwe1jw1495fyn7770ujykvl1f8sskbzsevlux062ajragz9hp3akdqbmdg')
    const docFTimestamps = []
    const docFStates = []

    beforeAll(async () => {
      ceramic = await createCeramic()
      const controller = ceramic.context.did.id

      docF = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, {
        content: { test: '321f' },
        metadata: { controllers: [controller] }
      })
      docE = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, {
        content: { f: docF.id.toUrl() },
        metadata: { controllers: [controller] }
      })
      docD = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, {
        content: { test: '321d'  },
        metadata: { controllers: [controller] }
      })
      docC = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, {
        content: { test: '321c' },
        metadata: { controllers: [controller] }
      })
      docB = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, {
        content: { e: docE.id.toUrl(),
                   d: docD.id.toUrl(),
                   notDoc: '123' },
        metadata: { controllers: [controller] }
      })
      docA = await ceramic.createDocument<TileDoctype>(DOCTYPE_TILE, {
        content: { b: docB.id.toUrl(),
                   c: docC.id.toUrl(),
                   notExistDocId: notExistDocId.toUrl(),
                   notDoc: '123' },
        metadata: { controllers: [controller] }
      })

      // test data for the atTime feature
      docFStates.push(docF.state)
      docFTimestamps.push(Date.now())
      await docF.change({ content: { ...docF.content, update: 'new stuff' }})
      await anchorDoc(ceramic, docF)
      docFTimestamps.push(Date.now())
      docFStates.push(docF.state)
      await docF.change({ content: { ...docF.content, update: 'newer stuff' }})
      await anchorDoc(ceramic, docF)
      docFTimestamps.push(Date.now())
      docFStates.push(docF.state)
    })

    afterAll(async () => {
      await ceramic.close()
    })

    it('can load linked doc path, returns expected form', async () => {
      const docs = await ceramic._loadLinkedDocuments({ docId: docA.id, paths: ['/b/e'] })
      // inlcudes all linked docs in path, including root, key by docid string
      expect(docs[docA.id.toString()]).toBeTruthy()
      expect(docs[docB.id.toString()]).toBeTruthy()
      expect(docs[docE.id.toString()]).toBeTruthy()
      // maps to content
      expect(docs[docA.id.toString()].content).toEqual(docA.content)
      expect(docs[docB.id.toString()].content).toEqual(docB.content)
      expect(docs[docE.id.toString()].content).toEqual(docE.content)
    })

    it('can load multiple paths', async () => {
      const docs = await ceramic._loadLinkedDocuments({ docId: docA.id, paths: ['/b/e/f', '/c', '/b/d'] })
      expect(Object.keys(docs).length).toEqual(6)
      expect(docs[docA.id.toString()]).toBeTruthy()
      expect(docs[docB.id.toString()]).toBeTruthy()
      expect(docs[docC.id.toString()]).toBeTruthy()
      expect(docs[docD.id.toString()]).toBeTruthy()
      expect(docs[docE.id.toString()]).toBeTruthy()
      expect(docs[docF.id.toString()]).toBeTruthy()
    })

    it('can load multiple paths, including redundant subpaths and paths', async () => {
      const docs = await ceramic._loadLinkedDocuments({ docId: docA.id, paths: ['/b/e/f', '/c', '/b/d', '/b', 'b/e'] })
      expect(Object.keys(docs).length).toEqual(6)
      expect(docs[docA.id.toString()]).toBeTruthy()
      expect(docs[docB.id.toString()]).toBeTruthy()
      expect(docs[docC.id.toString()]).toBeTruthy()
      expect(docs[docD.id.toString()]).toBeTruthy()
      expect(docs[docE.id.toString()]).toBeTruthy()
      expect(docs[docF.id.toString()]).toBeTruthy()
    })

    it('can load multiple paths and ignore paths that dont exist', async () => {
      const docs = await ceramic._loadLinkedDocuments({ docId: docA.id, paths: ['/b', '/c/g/h', 'c/g/j', '/c/k'] })
      expect(Object.keys(docs).length).toEqual(3)
      expect(docs[docA.id.toString()]).toBeTruthy()
      expect(docs[docB.id.toString()]).toBeTruthy()
      expect(docs[docC.id.toString()]).toBeTruthy()
    })

    it('can load multiple paths and ignore invalid paths (ie not docs)', async () => {
      const docs = await ceramic._loadLinkedDocuments({ docId: docA.id, paths: ['/b', '/b/notDoc', '/notDoc'] })
      expect(Object.keys(docs).length).toEqual(2)
      expect(docs[docA.id.toString()]).toBeTruthy()
      expect(docs[docB.id.toString()]).toBeTruthy()
    })

    it('can load docs for array of multiqueries', async () => {
      const queries = [
        {
          docId: docA.id,
          paths: ['/b']
        },
        {
          docId: docE.id,
          paths: ['/f']
        }
      ]
      const docs = await ceramic.multiQuery(queries)

      expect(Object.keys(docs).length).toEqual(4)
      expect(docs[docA.id.toString()]).toBeTruthy()
      expect(docs[docB.id.toString()]).toBeTruthy()
      expect(docs[docE.id.toString()]).toBeTruthy()
      expect(docs[docF.id.toString()]).toBeTruthy()
    })

    it('can load docs for array of overlapping multiqueries', async () => {
      const queries = [
        {
          docId: docA.id,
          paths: ['/b', '/c']
        },
        {
          docId: docB.id,
          paths: ['/e/f', '/d']
        }
      ]
      const docs = await ceramic.multiQuery(queries)
      expect(Object.keys(docs).length).toEqual(6)
    })

    it('can load docs for array of multiqueries even if docid or path throws error', async () => {
      const queries = [
        {
          docId: docA.id,
          paths: ['/b/d', '/notExistDocId']
        },
        {
          docId: notExistDocId,
          paths: ['/e/f' , '/d']
        }
      ]
      const docs = await ceramic.multiQuery(queries, 1000)
      expect(Object.keys(docs).length).toEqual(3)
    })

    it('can load docs for array of multiqueries including paths that dont exist', async () => {
      const queries = [
        {
          docId: docA.id,
          paths: ['/1', '2/3/4', '5/6']
        },
        {
          docId: docE.id,
          paths: ['/1', '2/3/4', '5/6']
        },
        {
          docId: docB.id,
          paths: ['/1', '2/3/4', '5/6']
        }
      ]
        const docs = await ceramic.multiQuery(queries)

        expect(Object.keys(docs).length).toEqual(3)
        expect(docs[docA.id.toString()]).toBeTruthy()
        expect(docs[docB.id.toString()]).toBeTruthy()
        expect(docs[docE.id.toString()]).toBeTruthy()
    })

    it('loads the same document at multiple points in time', async () => {
      const queries = [
        {
          docId: docF.id,
          atTime: docFTimestamps[0]
        },
        {
          docId: docF.id,
          atTime: docFTimestamps[1]
        },
        {
          docId: docF.id,
          atTime: docFTimestamps[2]
        },
        {
          docId: docF.id,
        }
      ]
      const docs = await ceramic.multiQuery(queries)

      expect(Object.keys(docs).length).toEqual(4)
      const states = Object.values(docs).map(doc => doc.state)
      // annoying thing, was pending when snapshotted but will
      // obviously not be when rewinded
      docFStates[0].anchorStatus = 0
      expect(states[0]).toEqual(docFStates[0])
      expect(states[1]).toEqual(docFStates[1])
      expect(states[2]).toEqual(docFStates[2])
      expect(states[3]).toEqual(docF.state)
    })
  })
})
