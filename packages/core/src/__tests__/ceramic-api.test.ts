import Ceramic, { CeramicConfig } from '../ceramic'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import { TileDoctype } from "@ceramicnetwork/doctype-tile"
import { AnchorStatus, DoctypeUtils, IpfsApi } from "@ceramicnetwork/common"
import StreamID from '@ceramicnetwork/streamid'
import * as u8a from 'uint8arrays'
import cloneDeep from 'lodash.clonedeep'
import { createIPFS } from './ipfs-util';
import { anchorUpdate } from '../state-management/__tests__/anchor-update';
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import KeyDidResolver from 'key-did-resolver'
import { Resolver } from "did-resolver"
import { DID } from 'dids'

jest.mock('../store/level-state-store')

const seed = u8a.fromString('6e34b2e1a9624113d81ece8a8a22e6e97f0e145c25c1d4d2d0e62753b4060c83', 'base16')

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

  const stringMapSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "StringMap",
    "type": "object",
    "additionalProperties": {
      "type": "string"
    }
  }

  const makeDID = function(seed: Uint8Array, ceramic: Ceramic): DID {
    const provider = new Ed25519Provider(seed)

    const keyDidResolver = KeyDidResolver.getResolver()
    const threeIdResolver = ThreeIdResolver.getResolver(ceramic)
    const resolver = new Resolver({
      ...threeIdResolver, ...keyDidResolver,
    })
    return new DID({ provider, resolver })
  }

  const createCeramic = async (c: CeramicConfig = {}): Promise<Ceramic> => {
    c.anchorOnRequest = false
    c.restoreStreams = false
    const ceramic = await Ceramic.create(ipfs, c)

    await ceramic.setDID(makeDID(seed, ceramic))
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
      const docOg = await TileDoctype.create(ceramic, { test: 321 })

      // wait for anchor (new commit)
      await anchorUpdate(ceramic, docOg)

      expect(docOg.state.log.length).toEqual(2)
      expect(docOg.content).toEqual({ test: 321 })
      expect(docOg.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      const stateOg = docOg.state

      await docOg.update({test: 'abcde'})

      // wait for anchor (new commit)
      await anchorUpdate(ceramic, docOg)

      expect(docOg.state.log.length).toEqual(4)
      expect(docOg.content).toEqual({ test: 'abcde' })
      expect(docOg.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      const docV1Id = docOg.id.atCommit(docOg.state.log[1].cid)
      const docV1 = await ceramic.loadDocument<TileDoctype>(docV1Id)
      expect(docV1.state).toEqual(stateOg)
      expect(docV1.content).toEqual({ test: 321 })
      expect(docV1.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      // try to call doctype.update
      try {
        await docV1.update({ test: 'fghj' })
        throw new Error('Should not be able to update commit')
      } catch (e) {
        expect(e.message).toEqual('Historical document commits cannot be modified. Load the document without specifying a commit to make updates.')
      }

      await expect( async () => {
        const updateRecord = await docV1.makeCommit(ceramic, { test: 'fghj' })
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await ceramic.applyCommit(docV1Id, updateRecord, { anchor: false, publish: false })
      }).rejects.toThrow(/Not StreamID/)

      // checkout not anchored commit
      const docV2Id = docOg.id.atCommit(docOg.state.log[2].cid)
      const docV2 = await TileDoctype.load(ceramic, docV2Id)
      expect(docV2.content).toEqual({ test: "abcde" })
      expect(docV2.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)
    })

    it('cannot create document with invalid schema', async () => {
      const schemaDoc = await TileDoctype.create(ceramic, stringMapSchema)

      try {
        await TileDoctype.create(ceramic, {a: 1}, {schema: schemaDoc.commitId})
        fail('Should not be able to create an invalid document')
      } catch (e) {
        console.log(e)
        expect(e.message).toEqual('Validation Error: data[\'a\'] should be string')
      }
    })

    it('can create document with valid schema', async () => {
      const schemaDoc = await TileDoctype.create(ceramic, stringMapSchema)
      await TileDoctype.create(ceramic, {a: "test"}, {schema: schemaDoc.commitId})
    })

    it('must assign schema with specific commit', async () => {
      const schemaDoc = await TileDoctype.create(ceramic, stringMapSchema)
      await expect(TileDoctype.create(ceramic, {a: 1}, {schema: schemaDoc.id.toString()})).rejects.toThrow('Schema must be a CommitID')
    })

    it('can create document with invalid schema if validation is not set', async () => {
      await ceramic.close()
      ceramic = await createCeramic({ validateStreams: false })

      const schemaDoc = await TileDoctype.create(ceramic, stringMapSchema)
      await TileDoctype.create(ceramic, {a: 1}, {schema: schemaDoc.commitId})
    })

    it('can assign schema if content is valid', async () => {
      const doc = await TileDoctype.create(ceramic, {a: 'x'})
      const schemaDoc = await TileDoctype.create(ceramic, stringMapSchema)
      await doc.update(doc.content, {schema: schemaDoc.commitId})

      expect(doc.content).toEqual({ a: 'x' })
      expect(doc.metadata.schema).toEqual(schemaDoc.commitId.toString())
    })

    it('cannot assign schema if content is not valid', async () => {
      const doc = await TileDoctype.create(ceramic, {a: 1})
      const schemaDoc = await TileDoctype.create(ceramic, stringMapSchema)

      try {
        await doc.update(doc.content, {schema: schemaDoc.commitId})
        fail('Should not be able to update the document with invalid content')
      } catch (e) {
        expect(e.message).toEqual('Validation Error: data[\'a\'] should be string')
      }
    })

    it('can update valid content and assign schema at the same time', async () => {
      const doc = await TileDoctype.create(ceramic, {a: 1})
      const schemaDoc = await TileDoctype.create(ceramic, stringMapSchema)

      await doc.update({a: 'x'}, {schema: schemaDoc.commitId})

      expect(doc.content).toEqual({ a: 'x' })
    })

    it('can update schema and then assign to doc with now valid content', async () => {
      // Create doc with content that has type 'number'.
      const doc = await TileDoctype.create(ceramic, {a: 1})
      await anchorUpdate(ceramic, doc)

      // Create schema that enforces that the content value is a string, which would reject
      // the document created above.
      const schemaDoc = await TileDoctype.create(ceramic, stringMapSchema)

      // wait for anchor
      await anchorUpdate(ceramic, schemaDoc)
      expect(schemaDoc.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      // Update the schema to expect a number, so now the original doc should conform to the new
      // commit of the schema
      const updatedSchema = cloneDeep(stringMapSchema)
      updatedSchema.additionalProperties.type = "number"
      await schemaDoc.update(updatedSchema)
      // wait for anchor
      await anchorUpdate(ceramic, schemaDoc)
      expect(schemaDoc.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      // Test that we can assign the updated schema to the document without error.
      await doc.update(doc.content, {schema: schemaDoc.commitId})
      await anchorUpdate(ceramic, doc)
      expect(doc.content).toEqual({ a: 1 })

      // Test that we can reload the document without issue
      const doc2 = await ceramic.loadDocument(doc.id)
      expect(doc2.content).toEqual(doc.content)
      expect(doc2.metadata).toEqual(doc.metadata)
    })

    it('can list log records', async () => {
      const doc = await TileDoctype.create(ceramic, {a: 1})
      const logRecords = await ceramic.loadDocumentCommits(doc.id)
      expect(logRecords).toBeDefined()

      const expected = []
      for (const { cid } of doc.state.log) {
        const record = (await ceramic.ipfs.dag.get(cid)).value
        expected.push({
          cid: cid.toString(),
          value: await DoctypeUtils.convertCommitToSignedCommitContainer(record, ipfs)
        })
      }

      expect(logRecords).toEqual(expected)
    })

    it('can store record if the size is lesser than the maximum size ~256KB', async () => {
      const doctype = await TileDoctype.create(ceramic, { test: generateStringOfSize(10000) })
      expect(doctype).not.toBeNull();
    })

    it('cannot store record if the size is greated than the maximum size ~256KB', async () => {
      await expect(TileDoctype.create(ceramic, { test: generateStringOfSize(1000000) })).rejects.toThrow(/exceeds the maximum block size of/)
    })
  })

  describe('API MultiQueries', () => {

    let ceramic: Ceramic
    let docA: TileDoctype, docB: TileDoctype, docC: TileDoctype, docD: TileDoctype, docE: TileDoctype, docF: TileDoctype
    const notExistStreamId = StreamID.fromString('kjzl6cwe1jw1495fyn7770ujykvl1f8sskbzsevlux062ajragz9hp3akdqbmdg')
    const docFTimestamps = []
    const docFStates = []

    beforeAll(async () => {
      ceramic = await createCeramic()

      docF = await TileDoctype.create(ceramic, { test: '321f' })
      docE = await TileDoctype.create(ceramic, { f: docF.id.toUrl() })
      docD = await TileDoctype.create(ceramic, { test: '321d' })
      docC = await TileDoctype.create(ceramic, { test: '321c' })
      docB = await TileDoctype.create(ceramic, { e: docE.id.toUrl(),
                                                  d: docD.id.toUrl(),
                                                  notDoc: '123' })
      docA = await TileDoctype.create(ceramic, { b: docB.id.toUrl(),
                                                  c: docC.id.toUrl(),
                                                  notExistStreamId: notExistStreamId.toUrl(),
                                                  notDoc: '123' })
    })

    afterAll(async () => {
      await ceramic.close()
    })

    it('can load linked doc path, returns expected form', async () => {
      const docs = await ceramic._loadLinkedDocuments({ streamId: docA.id, paths: ['/b/e'] })
      // inlcudes all linked docs in path, including root, key by streamid string
      expect(docs[docA.id.toString()]).toBeTruthy()
      expect(docs[docB.id.toString()]).toBeTruthy()
      expect(docs[docE.id.toString()]).toBeTruthy()
      // maps to content
      expect(docs[docA.id.toString()].content).toEqual(docA.content)
      expect(docs[docB.id.toString()].content).toEqual(docB.content)
      expect(docs[docE.id.toString()].content).toEqual(docE.content)
    })

    it('can load multiple paths', async () => {
      const docs = await ceramic._loadLinkedDocuments({ streamId: docA.id, paths: ['/b/e/f', '/c', '/b/d'] })
      expect(Object.keys(docs).length).toEqual(6)
      expect(docs[docA.id.toString()]).toBeTruthy()
      expect(docs[docB.id.toString()]).toBeTruthy()
      expect(docs[docC.id.toString()]).toBeTruthy()
      expect(docs[docD.id.toString()]).toBeTruthy()
      expect(docs[docE.id.toString()]).toBeTruthy()
      expect(docs[docF.id.toString()]).toBeTruthy()
    })

    it('can load multiple paths, including redundant subpaths and paths', async () => {
      const docs = await ceramic._loadLinkedDocuments({ streamId: docA.id, paths: ['/b/e/f', '/c', '/b/d', '/b', 'b/e'] })
      expect(Object.keys(docs).length).toEqual(6)
      expect(docs[docA.id.toString()]).toBeTruthy()
      expect(docs[docB.id.toString()]).toBeTruthy()
      expect(docs[docC.id.toString()]).toBeTruthy()
      expect(docs[docD.id.toString()]).toBeTruthy()
      expect(docs[docE.id.toString()]).toBeTruthy()
      expect(docs[docF.id.toString()]).toBeTruthy()
    })

    it('can load multiple paths and ignore paths that dont exist', async () => {
      const docs = await ceramic._loadLinkedDocuments({ streamId: docA.id, paths: ['/b', '/c/g/h', 'c/g/j', '/c/k'] })
      expect(Object.keys(docs).length).toEqual(3)
      expect(docs[docA.id.toString()]).toBeTruthy()
      expect(docs[docB.id.toString()]).toBeTruthy()
      expect(docs[docC.id.toString()]).toBeTruthy()
    })

    it('can load multiple paths and ignore invalid paths (ie not docs)', async () => {
      const docs = await ceramic._loadLinkedDocuments({ streamId: docA.id, paths: ['/b', '/b/notDoc', '/notDoc'] })
      expect(Object.keys(docs).length).toEqual(2)
      expect(docs[docA.id.toString()]).toBeTruthy()
      expect(docs[docB.id.toString()]).toBeTruthy()
    })

    it('can load docs for array of multiqueries', async () => {
      const queries = [
        {
          streamId: docA.id,
          paths: ['/b']
        },
        {
          streamId: docE.id,
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
          streamId: docA.id,
          paths: ['/b', '/c']
        },
        {
          streamId: docB.id,
          paths: ['/e/f', '/d']
        }
      ]
      const docs = await ceramic.multiQuery(queries)
      expect(Object.keys(docs).length).toEqual(6)
    })

    it('can load docs for array of multiqueries even if streamid or path throws error', async () => {
      const queries = [
        {
          streamId: docA.id,
          paths: ['/b/d', '/notExistStreamId']
        },
        {
          streamId: notExistStreamId,
          paths: ['/e/f' , '/d']
        }
      ]
      const docs = await ceramic.multiQuery(queries, 1000)
      expect(Object.keys(docs).length).toEqual(3)
    })

    it('can load docs for array of multiqueries including paths that dont exist', async () => {
      const queries = [
        {
          streamId: docA.id,
          paths: ['/1', '2/3/4', '5/6']
        },
        {
          streamId: docE.id,
          paths: ['/1', '2/3/4', '5/6']
        },
        {
          streamId: docB.id,
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
      // test data for the atTime feature
      const delay = () => new Promise(resolve => setTimeout(resolve, 1000))
      docFStates.push(docF.state)
      // timestamp before the first anchor commit
      docFTimestamps.push(Math.floor(Date.now() / 1000))
      await delay()
      await docF.update({ ...docF.content, update: 'new stuff' })
      await anchorUpdate(ceramic, docF)
      await delay()
      // timestamp between the first and the second anchor commit
      docFTimestamps.push(Math.floor(Date.now() / 1000))
      docFStates.push(docF.state)
      await delay()
      await docF.update({ ...docF.content, update: 'newer stuff' })
      await anchorUpdate(ceramic, docF)
      await delay()
      // timestamp after the second anchor commit
      docFTimestamps.push(Math.floor(Date.now() / 1000))
      docFStates.push(docF.state)

      const queries = [
        {
          streamId: docF.id,
          atTime: docFTimestamps[0]
        },
        {
          streamId: docF.id,
          atTime: docFTimestamps[1]
        },
        {
          streamId: docF.id,
          atTime: docFTimestamps[2]
        },
        {
          streamId: docF.id,
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
