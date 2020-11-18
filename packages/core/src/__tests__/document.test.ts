import CID from 'cids'
import Document from '../document'
import tmp from 'tmp-promise'
import Dispatcher from '../dispatcher'
import Ceramic from "../ceramic"
import DocID from '@ceramicnetwork/docid'
import { Context, PinningBackend } from "@ceramicnetwork/common"
import { AnchorStatus, DocOpts, SignatureStatus } from "@ceramicnetwork/common"
import { AnchorService } from "@ceramicnetwork/common"
import { TileDoctype, TileParams, TileDoctypeHandler } from "@ceramicnetwork/doctype-tile"
import { PinStore } from "../store/pin-store";
import { LevelStateStore } from "../store/level-state-store";
import { DID } from "dids"

import { Resolver } from "did-resolver"
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'

jest.mock('../store/level-state-store')

import InMemoryAnchorService from "../anchor/memory/in-memory-anchor-service"

jest.mock('../dispatcher', () => {
  const CID = require('cids') // eslint-disable-line @typescript-eslint/no-var-requires
  const cloneDeep = require('lodash.clonedeep') // eslint-disable-line @typescript-eslint/no-var-requires
  const { sha256 } = require('js-sha256') // eslint-disable-line @typescript-eslint/no-var-requires
  const { DoctypeUtils } = require('@ceramicnetwork/common') // eslint-disable-line @typescript-eslint/no-var-requires
  const dagCBOR = require('ipld-dag-cbor') // eslint-disable-line @typescript-eslint/no-var-requires
  const hash = (data: string): CID => new CID(1, 'sha2-256', Buffer.from('1220' + sha256(data), 'hex'))
  return (gossip: boolean): any => {
    const recs: Record<any, any> = {}
    const docs: Record<string, Document> = {}
    return {
      _ipfs: {
        dag: {
          put(rec: any): any {
            // stringify as a way of doing deep copy
            const clone = cloneDeep(rec)
            const cid = hash(JSON.stringify(clone))
            recs[cid.toString()] = clone
            return cid
          },
          get(cid: any): any {
            return {
              value: recs[cid.toString()]
            }
          }
        }
      },
      register: jest.fn((doc) => {
        docs[doc.id] = doc
      }),
      storeRecord: jest.fn(async (rec) => {
        if (DoctypeUtils.isSignedRecordDTO(rec)) {
          const { jws, linkedBlock } = rec
          const block = dagCBOR.util.deserialize(linkedBlock)

          const cidLink = hash(JSON.stringify(block))
          recs[cidLink.toString()] = block

          const clone = cloneDeep(jws)
          clone.link = cidLink
          const cidJws = hash(JSON.stringify(clone))
          recs[cidJws.toString()] = clone
          return cidJws
        }

        // stringify as a way of doing deep copy
        const clone = cloneDeep(rec)
        const cid = hash(JSON.stringify(clone))
        recs[cid.toString()] = clone
        return cid
      }),
      publishTip: jest.fn((id, tip) => {
        if (gossip) {
          docs[id]._handleTip(tip)
        }
      }),
      _requestTip: (id: string): void => {
        if (gossip) {
          docs[id]._publishTip()
        }
      },
      retrieveRecord: jest.fn(cid => {
        return recs[cid.toString()]
      }),
      retrieveRecordByPath: jest.fn((cid) => {
        const rootCid = recs[cid.toString()].root
        return recs[rootCid.toString()]
      })
    }
  }
})

const anchorUpdate = (doc: Document): Promise<void> => new Promise(resolve => doc.doctype.on('change', resolve))

const create = async (params: TileParams, ceramic: Ceramic, context: Context, opts: DocOpts = {}): Promise<Document> => {
  const { content, metadata } = params
  if (!metadata?.controllers) {
    throw new Error('The controller of the 3ID needs to be specified')
  }

  const record = await TileDoctype.makeGenesis({ content, metadata }, context)
  return await ceramic._createDocFromGenesis("tile", record, opts)
}

const stringMapSchema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "StringMap",
  "type": "object",
  "additionalProperties": {
    "type": "string"
  }
}

let stateStore: LevelStateStore
let pinStore: PinStore
let pinning: PinningBackend

beforeEach(async () => {
  const levelPath = await tmp.tmpName()
  stateStore = new LevelStateStore(levelPath)
  pinning = {
    open: jest.fn(),
    close: jest.fn(),
    pin: jest.fn(),
    unpin: jest.fn()
  }
  pinStore = new PinStore(stateStore, pinning, jest.fn(), jest.fn())
  await pinStore.open()
})

describe('Document', () => {
  describe('Log logic', () => {
    const initialContent = { abc: 123, def: 456 }
    const newContent = { abc: 321, def: 456, gh: 987 }
    const controllers = ['did:3:bafyasdfasdf']
    let user: DID
    let dispatcher: any;
    let doctypeHandler: TileDoctypeHandler;
    let anchorService: AnchorService;
    let ceramic: Ceramic;
    let ceramicWithoutSchemaValidation: Ceramic;
    let context: Context;

    beforeEach(() => {
      dispatcher = Dispatcher(false)
      anchorService = new InMemoryAnchorService({})
      user = new DID()
      user.createJWS = jest.fn(async () => {
        // fake jws
        return 'eyJraWQiOiJkaWQ6MzpiYWZ5YXNkZmFzZGY_dmVyc2lvbj0wI3NpZ25pbmciLCJhbGciOiJFUzI1NksifQ.bbbb.cccc'
      })
      user._id = 'did:3:bafyasdfasdf'
      doctypeHandler = new TileDoctypeHandler()
      doctypeHandler.verifyJWS = async (): Promise<void> => { return }

      const threeIdResolver = ThreeIdResolver.getResolver({
        loadDocument: (): any => {
          return Promise.resolve({
            content: {
              "publicKeys": {
                "signing": "zQ3shwsCgFanBax6UiaLu1oGvM7vhuqoW88VBUiUTCeHbTeTV",
                "encryption": "z6LSfQabSbJzX8WAm1qdQcHCHTzVv8a2u6F7kmzdodfvUCo9"
              }
            }
          })
        }
      })

      const resolver = new Resolver({ ...threeIdResolver })
      context = {
        did: user,
        anchorService,
        ipfs: dispatcher._ipfs,
        resolver,
        provider: null,
      }

      anchorService.ceramic = {
        context: {
          ipfs: dispatcher._ipfs,
          resolver,
        },
        dispatcher,
      }

      ceramic = new Ceramic(dispatcher, pinStore, context)
      ceramic._doctypeHandlers['tile'] = doctypeHandler

      ceramicWithoutSchemaValidation = new Ceramic(dispatcher, pinStore, context, false)
      ceramicWithoutSchemaValidation._doctypeHandlers['tile'] = doctypeHandler
    })

    it('is created correctly', async () => {
      const doc = await create({ content: initialContent, metadata: { controllers, tags: ['3id'] } }, ceramic, context)

      expect(doc.content).toEqual(initialContent)
      expect(dispatcher.register).toHaveBeenCalledWith(doc)
      expect(doc.state.anchorStatus).toEqual(AnchorStatus.PENDING)
      await anchorUpdate(doc)
      expect(doc.state.anchorStatus).not.toEqual(AnchorStatus.NOT_REQUESTED)
    })

    it('is loaded correctly', async () => {
      const doc1 = await create({ content: initialContent, metadata: { controllers, tags: ['3id'] } }, ceramic, context, { applyOnly: true, skipWait: true })
      const doc2 = await Document.load(doc1.id, doctypeHandler, dispatcher, pinStore, context, { skipWait: true })

      expect(doc1.id).toEqual(doc2.id)
      expect(doc1.content).toEqual(initialContent)
      expect(doc1.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)
    })

    it('handles new tip correctly', async () => {
      const tmpDoc = await create({ content: initialContent, metadata: { controllers, tags: ['3id'] } }, ceramic, context)
      await anchorUpdate(tmpDoc)
      const docId = tmpDoc.id
      const log = tmpDoc.state.log
      const doc = await Document.load(docId, doctypeHandler, dispatcher, pinStore, context, { skipWait: true })
      // changes will not load since no network and no local tip storage yet
      expect(doc.content).toEqual(initialContent)
      expect(doc.state).toEqual(expect.objectContaining({ signature: SignatureStatus.SIGNED, anchorStatus: 0 }))
      // _handleTip is intended to be called by the dispatcher
      // should return a promise that resolves when tip is added
      await doc._handleTip(log[1].cid)
      expect(doc.state.signature).toEqual(SignatureStatus.SIGNED)
      expect(doc.state.anchorStatus).not.toEqual(AnchorStatus.NOT_REQUESTED)
      expect(doc.content).toEqual(initialContent)
    })

    it('it handles versions correctly (valid, invalid, non-existent)', async () => {
      const doc = await create({ content: initialContent, metadata: { controllers, tags: ['3id'] } }, ceramic, context)

      let versions = doc.allVersionIds
      const version0 = doc.versionId
      expect(versions).toEqual([version0])
      expect(version0).toEqual(DocID.fromOther(doc.id, doc.id.cid))

      await anchorUpdate(doc)

      versions = doc.allVersionIds
      expect(versions.length).toEqual(2)
      const version1 = doc.versionId
      expect(version1).not.toEqual(version0)
      expect(version1).toEqual(versions[1])

      const updateRec = await TileDoctype._makeRecord(doc.doctype, user, newContent, doc.controllers)

      versions = doc.allVersionIds
      expect(versions.length).toEqual(2)

      await doc.applyRecord(updateRec)

      versions = doc.allVersionIds
      expect(versions.length).toEqual(2)
      expect(doc.versionId).toEqual(version1)

      await anchorUpdate(doc)

      versions = doc.allVersionIds
      expect(versions.length).toEqual(3)
      const version2 = doc.versionId
      expect(version2).not.toEqual(version1)
      expect(version2).toEqual(versions[2])

      expect(doc.content).toEqual(newContent)
      expect(doc.state.signature).toEqual(SignatureStatus.SIGNED)
      expect(doc.state.anchorStatus).not.toEqual(AnchorStatus.NOT_REQUESTED)

      // try to checkout non-existing version
      try {
        await Document.loadVersion(doc, new CID('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu'))
        throw new Error('Should not be able to fetch non-existing version')
      } catch (e) {
        expect(e.message).toContain('No record found for version')
      }

      // try to checkout not anchored version
      try {
        await Document.loadVersion(doc, doc.doctype.state.log[2].cid)
        throw new Error('Should not be able to fetch not anchored version')
      } catch (e) {
        expect(e.message).toContain('No anchor record for version')
      }

      const docV1 = await Document.loadVersion(doc, doc.doctype.state.log[1].cid)
      expect(docV1.state.log.length).toEqual(2)
      expect(docV1.controllers).toEqual(controllers)
      expect(docV1.content).toEqual(initialContent)
      expect(docV1.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      // try to call doctype.change
      try {
        await docV1.doctype.change({ content: doc.content, controllers: doc.controllers })
        throw new Error('Should not be able to fetch not anchored version')
      } catch (e) {
        expect(e.message).toEqual('Historical document versions cannot be modified. Load the document without specifying a version to make updates.')
      }
    })

    it('is updated correctly', async () => {
      const doc = await create({ content: initialContent, metadata: { controllers, tags: ['3id'] } }, ceramic, context)
      await anchorUpdate(doc)

      const updateRec = await TileDoctype._makeRecord(doc.doctype, user, newContent, doc.controllers)
      await doc.applyRecord(updateRec)

      await anchorUpdate(doc)
      expect(doc.content).toEqual(newContent)
      expect(doc.state.signature).toEqual(SignatureStatus.SIGNED)
      expect(doc.state.anchorStatus).not.toEqual(AnchorStatus.NOT_REQUESTED)
    })

    it('handles conflict', async () => {
      const fakeState = { asdf: 2342 }
      const doc1 = await create({ content: initialContent, metadata: { controllers, tags: ['3id'] } }, ceramic, context)
      const docId = doc1.id
      await anchorUpdate(doc1)
      const tipPreUpdate = doc1.tip

      let updateRec = await TileDoctype._makeRecord(doc1.doctype, user, newContent, doc1.controllers)
      await doc1.applyRecord(updateRec)

      await anchorUpdate(doc1)
      expect(doc1.content).toEqual(newContent)
      const tipValidUpdate = doc1.tip
      // create invalid change that happened after main change
      const doc2 = await Document.load(docId, doctypeHandler, dispatcher, pinStore, context, { skipWait: true })
      await doc2._handleTip(tipPreUpdate)
      // add short wait to get different anchor time
      // sometime the tests are very fast
      await new Promise(resolve => setTimeout(resolve, 1))
      // TODO - better mock for anchors

      updateRec = await TileDoctype._makeRecord(doc2.doctype, user, fakeState, doc2.controllers)
      await doc2.applyRecord(updateRec)

      await anchorUpdate(doc2)
      const tipInvalidUpdate = doc2.tip
      expect(doc2.content).toEqual(fakeState)
      // loading tip from valid log to doc with invalid
      // log results in valid state
      await doc2._handleTip(tipValidUpdate)
      expect(doc2.content).toEqual(newContent)

      // loading tip from invalid log to doc with valid
      // log results in valid state
      await doc1._handleTip(tipInvalidUpdate)
      expect(doc1.content).toEqual(newContent)
    })

    it('Enforces schema at document creation', async () => {
      const schemaDoc = await create({ content: stringMapSchema, metadata: { controllers } }, ceramic, context)
      await anchorUpdate(schemaDoc)

      try {
        const docParams = {
          content: {stuff: 1},
          metadata: {controllers, schema: schemaDoc.versionId.toString()}
        }
        await create(docParams, ceramic, context)
        throw new Error('Should not be able to create a document with an invalid schema')
      } catch (e) {
        expect(e.message).toEqual('Validation Error: data[\'stuff\'] should be string')
      }
    })

    it('Enforces schema at document update', async () => {
      const schemaDoc = await create({ content: stringMapSchema, metadata: { controllers } }, ceramic, context)
      await anchorUpdate(schemaDoc)

      const docParams = {
        content: {stuff: 1},
        metadata: {controllers}
      }
      const doc = await create(docParams, ceramic, context)
      await anchorUpdate(doc)

      try {
        const updateRec = await TileDoctype._makeRecord(doc.doctype, user, null, doc.controllers, schemaDoc.versionId.toString())
        await doc.applyRecord(updateRec)
        throw new Error('Should not be able to assign a schema to a document that does not conform')
      } catch (e) {
        expect(e.message).toEqual('Validation Error: data[\'stuff\'] should be string')
      }
    })

    it('Enforces schema when loading genesis record', async () => {
      const schemaDoc = await create({ content: stringMapSchema, metadata: { controllers } }, ceramic, context)
      await anchorUpdate(schemaDoc)

      const docParams = {
        content: {stuff: 1},
        metadata: {controllers, schema: schemaDoc.versionId.toString()}
      }
      // Create a document that isn't conforming to the schema
      const doc = await create(docParams, ceramicWithoutSchemaValidation, context)
      await anchorUpdate(doc)

      expect(doc.content).toEqual({stuff:1})
      expect(doc.metadata.schema).toEqual(schemaDoc.versionId.toString())

      try {
        await Document.load(doc.id, doctypeHandler, dispatcher, pinStore, context, {skipWait:true})
        throw new Error('Should not be able to assign a schema to a document that does not conform')
      } catch (e) {
        expect(e.message).toEqual('Validation Error: data[\'stuff\'] should be string')
      }
    })

  })

  describe('Network update logic', () => {
    const initialContent = { abc: 123, def: 456 }
    const newContent = { abc: 321, def: 456, gh: 987 }
    const controllers = ['did:3:bafyasdfasdf']

    let dispatcher: any;
    let doctypeHandler: TileDoctypeHandler;
    let anchorService: AnchorService;
    let context: Context;
    let ceramic: Ceramic;
    let user: DID;

    beforeEach(() => {
      dispatcher = Dispatcher(true)
      anchorService = new InMemoryAnchorService({})
      anchorService.ceramic = {
        dispatcher,
      }
      user = new DID()
      user.createJWS = jest.fn(async () => {
        // fake jws
        return 'eyJraWQiOiJkaWQ6MzpiYWZ5YXNkZmFzZGY_dmVyc2lvbj0wI3NpZ25pbmciLCJhbGciOiJFUzI1NksifQ.bbbb.cccc'
      })
      user._id = 'did:3:bafyuser'
      doctypeHandler = new TileDoctypeHandler()
      doctypeHandler.verifyJWS = async (): Promise<void> => { return }

      const threeIdResolver = ThreeIdResolver.getResolver({
        loadDocument: (): any => {
          return Promise.resolve({
            content: {
              "publicKeys": {
                "signing": "zQ3shwsCgFanBax6UiaLu1oGvM7vhuqoW88VBUiUTCeHbTeTV",
                "encryption": "z6LSfQabSbJzX8WAm1qdQcHCHTzVv8a2u6F7kmzdodfvUCo9"
              }
            }
          })
        }
      })

      const resolver = new Resolver({ ...threeIdResolver })
      context = {
        did: user,
        anchorService,
        ipfs: dispatcher._ipfs,
        resolver,
        provider: null,
      }

      anchorService.ceramic = {
        context: {
          ipfs: dispatcher._ipfs,
          resolver,
        },
        dispatcher,
      }

      ceramic = new Ceramic(dispatcher, pinStore, context)
      ceramic._doctypeHandlers['tile'] = doctypeHandler
    })

    it('should announce change to network', async () => {
      const doc1 = await create({ content: initialContent, metadata: { controllers, tags: ['3id'] } }, ceramic, context)
      expect(dispatcher.publishTip).toHaveBeenCalledTimes(1)
      expect(dispatcher.publishTip).toHaveBeenCalledWith(doc1.id.toString(), doc1.tip, 'tile')
      await anchorUpdate(doc1)

      const updateRec = await TileDoctype._makeRecord(doc1.doctype, user, newContent, doc1.controllers)
      await doc1.applyRecord(updateRec)

      expect(doc1.content).toEqual(newContent)

      expect(dispatcher.publishTip).toHaveBeenCalledTimes(3)
      expect(dispatcher.publishTip).toHaveBeenCalledWith(doc1.id.toString(), doc1.tip, 'tile')
    })

    it('documents share updates', async () => {
      const doc1 = await create({ content: initialContent, metadata: { controllers, tags: ['3id'] } }, ceramic, context)
      await anchorUpdate(doc1)
      const doc2 = await Document.load(doc1.id, doctypeHandler, dispatcher, pinStore, context, { skipWait: true })

      const updatePromise = new Promise(resolve => {
        doc2.doctype.on('change', resolve)
      })

      const updateRec = await TileDoctype._makeRecord(doc1.doctype, user, newContent, doc1.controllers)
      await doc1.applyRecord(updateRec)

      expect(doc1.content).toEqual(newContent)

      await updatePromise
      expect(doc2.content).toEqual(newContent)
    })

    it('should publish tip on network request', async () => {
      const doc = await create({ content: initialContent, metadata: { controllers, tags: ['3id'] } }, ceramic, context)
      expect(dispatcher.publishTip).toHaveBeenCalledTimes(1)
      expect(dispatcher.publishTip).toHaveBeenNthCalledWith(1, doc.id.toString(), doc.tip, 'tile')

      await dispatcher._requestTip(doc.id)

      expect(dispatcher.publishTip).toHaveBeenCalledTimes(2)
      expect(dispatcher.publishTip).toHaveBeenNthCalledWith(2, doc.id.toString(), doc.tip, 'tile')

      // wait a bit to complete document handling
      await new Promise(resolve => setTimeout(resolve, 1000))
    })
  })
})
