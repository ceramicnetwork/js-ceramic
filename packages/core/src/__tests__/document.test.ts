import CID from 'cids'
import { Document } from '../document'
import tmp from 'tmp-promise'
import { Dispatcher } from '../dispatcher'
import Ceramic from "../ceramic"
import { Context, LoggerProvider, PinningBackend } from "@ceramicnetwork/common"
import { AnchorStatus, DocOpts, SignatureStatus } from "@ceramicnetwork/common"
import { AnchorService } from "@ceramicnetwork/common"
import { TileDoctype, TileParams } from "@ceramicnetwork/doctype-tile"
import { TileDoctypeHandler } from '@ceramicnetwork/doctype-tile-handler'
import { PinStore } from "../store/pin-store";
import { LevelStateStore } from "../store/level-state-store";
import { DID } from "dids"
import * as sha256 from '@stablelib/sha256'
import * as uint8arrays from 'uint8arrays'

import { Resolver } from "did-resolver"
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'

jest.mock('../store/level-state-store')

import InMemoryAnchorService from "../anchor/memory/in-memory-anchor-service"
import {FakeTopology} from "./fake-topology";
import {PinStoreFactory} from "../store/pin-store-factory";
import { Repository } from '../repository';

jest.mock('../dispatcher', () => {
  const CID = require('cids') // eslint-disable-line @typescript-eslint/no-var-requires
  const cloneDeep = require('lodash.clonedeep') // eslint-disable-line @typescript-eslint/no-var-requires
  const sha256 = require('@stablelib/sha256') // eslint-disable-line @typescript-eslint/no-var-requires
  const { DoctypeUtils } = require('@ceramicnetwork/common') // eslint-disable-line @typescript-eslint/no-var-requires
  const dagCBOR = require('ipld-dag-cbor') // eslint-disable-line @typescript-eslint/no-var-requires
  const u8a = require('uint8arrays') // eslint-disable-line @typescript-eslint/no-var-requires
  const hash = (data: string): CID => {
    const body = u8a.concat([u8a.fromString('1220', 'base16'), sha256.hash(u8a.fromString(data))])
    return new CID(1, 'sha2-256', body)
  }
  const Dispatcher = (gossip: boolean): any => {
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
      storeCommit: jest.fn(async (rec) => {
        if (DoctypeUtils.isSignedCommitContainer(rec)) {
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
      retrieveCommit: jest.fn(cid => {
        return recs[cid.toString()]
      }),
      retrieveFromIPFS: jest.fn((cid, path) => {
        // TODO: this doesn't actually handle path traversal properly
        return recs[cid.toString()]
      }),
      init: jest.fn(),
    }
  }

  return { Dispatcher }
})

const anchorUpdate = async (anchorService: InMemoryAnchorService, doc: Document): Promise<void> => {
  await anchorService.anchor()
  return new Promise(resolve => doc.doctype.on('change', resolve))
}

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
  await pinStore.open('fakeNetwork')
})

describe('Document', () => {
  describe('Log logic', () => {
    const initialContent = { abc: 123, def: 456 }
    const newContent = { abc: 321, def: 456, gh: 987 }
    const controllers = ['did:3:k2t6wyfsu4pg0t2n4j8ms3s33xsgqjhtto04mvq8w5a2v5xo48idyz38l7ydki']
    let user: DID
    let dispatcher: any;
    let doctypeHandler: TileDoctypeHandler;
    let anchorService: InMemoryAnchorService;
    let ceramic: Ceramic;
    let ceramicWithoutSchemaValidation: Ceramic;
    let context: Context;

    beforeEach(async () => {
      dispatcher = Dispatcher(false)
      anchorService = new InMemoryAnchorService({anchorOnRequest:false, verifySignatures: false})
      user = new DID()
      user.createJWS = jest.fn(async () => {
        // fake jws
        return { payload: 'bbbb', signatures: [{ protected: 'eyJraWQiOiJkaWQ6MzprMnQ2d3lmc3U0cGcwdDJuNGo4bXMzczMzeHNncWpodHRvMDRtdnE4dzVhMnY1eG80OGlkeXozOGw3eWRraT92ZXJzaW9uPTAjc2lnbmluZyIsImFsZyI6IkVTMjU2SyJ9', signature: 'cccc'}]}
      })
      user._id = 'did:3:k2t6wyfsu4pg0t2n4j8ms3s33xsgqjhtto04mvq8w5a2v5xo48idyz38l7ydki'
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
      const loggerProvider = new LoggerProvider()
      context = {
        did: user,
        anchorService,
        ipfs: dispatcher._ipfs,
        loggerProvider,
        resolver,
        provider: null,
      }

      const networkOptions = {
        name: 'inmemory',
        pubsubTopic: '/ceramic/inmemory',
      }

      const topology = new FakeTopology(dispatcher._ipfs, networkOptions.name, loggerProvider.getDiagnosticsLogger())

      const repository = new Repository()
      const pinStoreFactory = {
        createPinStore: async() => {
          return pinStore
        }
      };
      const modules = {
        anchorService,
        didResolver: resolver,
        dispatcher,
        ipfs: dispatcher._ipfs,
        ipfsTopology: topology,
        loggerProvider,
        pinStoreFactory: pinStoreFactory as any as PinStoreFactory,
        repository
      }

      const params = {
        cacheDocumentCommits: true,
        docCacheLimit: 100,
        networkOptions,
        supportedChains: ['inmemory:12345'],
        validateDocs: true,
      }

      ceramic = new Ceramic(modules, params)
      ceramic._doctypeHandlers['tile'] = doctypeHandler
      ceramic.context.resolver = resolver
      context.api = ceramic
      await ceramic._init(false, false)

      const paramsNoSchemaValidation = { ...params, validateDocs: false };
      ceramicWithoutSchemaValidation = new Ceramic(modules, paramsNoSchemaValidation)
      ceramicWithoutSchemaValidation._doctypeHandlers['tile'] = doctypeHandler
      ceramicWithoutSchemaValidation.context.resolver = resolver

      await ceramicWithoutSchemaValidation._init(false, false)
    })

    it('is created correctly', async () => {
      const doc = await create({ content: initialContent, metadata: { controllers, tags: ['3id'] } }, ceramic, context)

      expect(doc.content).toEqual(initialContent)
      expect(dispatcher.register).toHaveBeenCalledWith(doc)
      expect(doc.state.anchorStatus).toEqual(AnchorStatus.PENDING)
      await anchorUpdate(anchorService, doc)
      expect(doc.state.anchorStatus).not.toEqual(AnchorStatus.NOT_REQUESTED)
    })

    it('is loaded correctly', async () => {
      const doc1 = await create({ content: initialContent, metadata: { controllers, tags: ['3id'] } }, ceramic, context, { anchor: false, publish: false, sync: false })
      const doc2 = await Document.load(doc1.id, doctypeHandler, dispatcher, pinStore, context, { sync: false })

      expect(doc1.id).toEqual(doc2.id)
      expect(doc1.content).toEqual(initialContent)
      expect(doc1.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)
    })

    it('handles new tip correctly', async () => {
      const tmpDoc = await create({ content: initialContent, metadata: { controllers, tags: ['3id'] } }, ceramic, context)
      await anchorUpdate(anchorService, tmpDoc)
      const docId = tmpDoc.id
      const log = tmpDoc.state.log
      const doc = await Document.load(docId, doctypeHandler, dispatcher, pinStore, context, { sync: false })
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

    it('it handles commits correctly (valid, invalid, non-existent)', async () => {
      const doc = await create({ content: initialContent, metadata: { controllers, tags: ['3id'] } }, ceramic, context)

      let commits = doc.allCommitIds
      let anchorCommits = doc.anchorCommitIds
      const commit0 = doc.commitId
      expect(commits).toEqual([commit0])

      expect(commit0.equals(doc.id.atCommit(doc.id.cid))).toBeTruthy()
      expect(anchorCommits.length).toEqual(0)

      await anchorUpdate(anchorService, doc)

      commits = doc.allCommitIds
      anchorCommits = doc.anchorCommitIds
      expect(commits.length).toEqual(2)
      expect(anchorCommits.length).toEqual(1)
      const commit1 = doc.commitId
      expect(commit1.equals(commit0)).toBeFalsy()
      expect(commit1).toEqual(commits[1])
      expect(commit1).toEqual(anchorCommits[0])

      const updateRec = await TileDoctype._makeCommit(doc.doctype, user, newContent, doc.controllers)

      commits = doc.allCommitIds
      anchorCommits = doc.anchorCommitIds
      expect(commits.length).toEqual(2)
      expect(anchorCommits.length).toEqual(1)

      await doc.applyCommit(updateRec)

      commits = doc.allCommitIds
      anchorCommits = doc.anchorCommitIds
      expect(commits.length).toEqual(3)
      expect(anchorCommits.length).toEqual(1)
      const commit2 = doc.commitId
      expect(commit2.equals(commit1)).toBeFalsy()
      expect(commit2).toEqual(commits[2])

      await anchorUpdate(anchorService, doc)

      commits = doc.allCommitIds
      anchorCommits = doc.anchorCommitIds
      expect(commits.length).toEqual(4)
      expect(anchorCommits.length).toEqual(2)
      const commit3 = doc.commitId
      expect(commit3.equals(commit2)).toBeFalsy()
      expect(commit3).toEqual(commits[3])
      expect(commit3).toEqual(anchorCommits[1])

      expect(doc.content).toEqual(newContent)
      expect(doc.state.signature).toEqual(SignatureStatus.SIGNED)
      expect(doc.state.anchorStatus).not.toEqual(AnchorStatus.NOT_REQUESTED)

      // Apply a final record that never gets anchored and thus never becomes a proper commit
      const finalContent = {foo: 'bar'}
      const updateRec2 = await TileDoctype._makeCommit(doc.doctype, user, finalContent, doc.controllers)
      await doc.applyCommit(updateRec2)

      commits = doc.allCommitIds
      anchorCommits = doc.anchorCommitIds
      expect(commits.length).toEqual(5)
      expect(anchorCommits.length).toEqual(2)
      const commit4 = doc.commitId
      expect(commit4.equals(commit3)).toBeFalsy()
      expect(commit4).toEqual(commits[4])
      expect(commit4.equals(anchorCommits[1])).toBeFalsy()
      expect(doc.state.log.length).toEqual(5)

      // try to load a non-existing commit
      const nonExistentCommitID = doc.id.atCommit(new CID('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu'))
      try {
        await Document.loadAtCommit(nonExistentCommitID, doc)
        fail('Should not be able to fetch non-existing commit')
      } catch (e) {
        expect(e.message).toContain(`No commit found for CID ${nonExistentCommitID.commit?.toString()}`)
      }

      // Correctly check out a specific commit
      const docV0 = await Document.loadAtCommit(commit0, doc)
      expect(docV0.id.equals(commit0.baseID)).toBeTruthy()
      expect(docV0.state.log.length).toEqual(1)
      expect(docV0.controllers).toEqual(controllers)
      expect(docV0.content).toEqual(initialContent)
      expect(docV0.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)

      const docV1 = await Document.loadAtCommit(commit1, doc)
      expect(docV1.id.equals(commit1.baseID)).toBeTruthy()
      expect(docV1.state.log.length).toEqual(2)
      expect(docV1.controllers).toEqual(controllers)
      expect(docV1.content).toEqual(initialContent)
      expect(docV1.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      const docV2 = await Document.loadAtCommit(commit2, doc)
      expect(docV2.id.equals(commit2.baseID)).toBeTruthy()
      expect(docV2.state.log.length).toEqual(3)
      expect(docV2.controllers).toEqual(controllers)
      expect(docV2.content).toEqual(newContent)
      expect(docV2.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)

      const docV3 = await Document.loadAtCommit(commit3, doc)
      expect(docV3.id.equals(commit3.baseID)).toBeTruthy()
      expect(docV3.state.log.length).toEqual(4)
      expect(docV3.controllers).toEqual(controllers)
      expect(docV3.content).toEqual(newContent)
      expect(docV3.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      const docV4 = await Document.loadAtCommit(commit4, doc)
      expect(docV4.id.equals(commit4.baseID)).toBeTruthy()
      expect(docV4.state.log.length).toEqual(5)
      expect(docV4.controllers).toEqual(controllers)
      expect(docV4.content).toEqual(finalContent)
      expect(docV4.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)

      // try to call doctype.change on doc that's tied to a specific commit
      try {
        await docV4.doctype.change({ content: doc.content, controllers: doc.controllers })
        fail('Should not be able to change document that was loaded at a specific commit')
      } catch (e) {
        expect(e.message).toEqual('Historical document commits cannot be modified. Load the document without specifying a commit to make updates.')
      }
    })

    it('is updated correctly', async () => {
      const doc = await create({ content: initialContent, metadata: { controllers, tags: ['3id'] } }, ceramic, context)
      await anchorUpdate(anchorService, doc)

      const updateRec = await TileDoctype._makeCommit(doc.doctype, user, newContent, doc.controllers)
      await doc.applyCommit(updateRec)

      await anchorUpdate(anchorService, doc)
      expect(doc.content).toEqual(newContent)
      expect(doc.state.signature).toEqual(SignatureStatus.SIGNED)
      expect(doc.state.anchorStatus).not.toEqual(AnchorStatus.NOT_REQUESTED)
    })

    it('handles basic conflict', async () => {
      const doc1 = await create({ content: initialContent, metadata: { controllers, tags: ['3id'] } }, ceramic, context)
      const docId = doc1.id
      await anchorUpdate(anchorService, doc1)
      const tipPreUpdate = doc1.tip

      let updateRec = await TileDoctype._makeCommit(doc1.doctype, user, newContent, doc1.controllers)
      await doc1.applyCommit(updateRec)

      await anchorUpdate(anchorService, doc1)
      expect(doc1.content).toEqual(newContent)
      const tipValidUpdate = doc1.tip
      // create invalid change that happened after main change
      const doc2 = await Document.load(docId, doctypeHandler, dispatcher, pinStore, context, { sync: false })
      await doc2._handleTip(tipPreUpdate)
      // add short wait to get different anchor time
      // sometime the tests are very fast
      await new Promise(resolve => setTimeout(resolve, 1))
      // TODO - better mock for anchors

      const conflictingNewContent = { asdf: 2342 }
      updateRec = await TileDoctype._makeCommit(doc2.doctype, user, conflictingNewContent, doc2.controllers)
      await doc2.applyCommit(updateRec)

      await anchorUpdate(anchorService, doc2)
      const tipInvalidUpdate = doc2.tip
      expect(doc2.content).toEqual(conflictingNewContent)
      // loading tip from valid log to doc with invalid
      // log results in valid state
      await doc2._handleTip(tipValidUpdate)
      expect(doc2.content).toEqual(newContent)

      // loading tip from invalid log to doc with valid
      // log results in valid state
      await doc1._handleTip(tipInvalidUpdate)
      expect(doc1.content).toEqual(newContent)

      // Loading valid commit works
      const docAtValidCommit = await Document.loadAtCommit(docId.atCommit(tipValidUpdate), doc1)
      expect(docAtValidCommit.content).toEqual(newContent)

      // Loading invalid commit fails
      await expect(Document.loadAtCommit(docId.atCommit(tipInvalidUpdate), doc1)).rejects.toThrow(
          `Requested commit CID ${tipInvalidUpdate.toString()} not found in the log for document ${docId.toString()}`
      )
    })

    it('handles consecutive anchors', async () => {
      const doc = await create({ content: initialContent, metadata: { controllers, tags: ['3id'] } }, ceramic, context)

      const updateRec = await TileDoctype._makeCommit(doc.doctype, user, newContent, doc.controllers)
      await doc.applyCommit(updateRec)

      await anchorUpdate(anchorService, doc)
      expect(doc.content).toEqual(newContent)
      expect(doc.state.log).toHaveLength(3)
      expect(doc.state.signature).toEqual(SignatureStatus.SIGNED)
      expect(doc.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    })

    it('Enforces schema at document creation', async () => {
      const schemaDoc = await create({ content: stringMapSchema, metadata: { controllers } }, ceramic, context)
      await anchorUpdate(anchorService, schemaDoc)

      try {
        const docParams = {
          content: {stuff: 1},
          metadata: {controllers, schema: schemaDoc.commitId.toString()}
        }
        await create(docParams, ceramic, context)
        fail('Should not be able to create a document with an invalid schema')
      } catch (e) {
        expect(e.message).toEqual('Validation Error: data[\'stuff\'] should be string')
      }
    })

    it('Enforces schema in update that assigns schema', async () => {
      const schemaDoc = await create({ content: stringMapSchema, metadata: { controllers } }, ceramic, context)
      await anchorUpdate(anchorService, schemaDoc)

      const docParams = {
        content: {stuff: 1},
        metadata: {controllers}
      }
      const doc = await create(docParams, ceramic, context)
      await anchorUpdate(anchorService, doc)

      try {
        const updateRec = await TileDoctype._makeCommit(doc.doctype, user, null, doc.controllers, schemaDoc.commitId.toString())
        await doc.applyCommit(updateRec)
        fail('Should not be able to assign a schema to a document that does not conform')
      } catch (e) {
        expect(e.message).toEqual('Validation Error: data[\'stuff\'] should be string')
      }
    })

    it('Enforces previously assigned schema during future update', async () => {
      const schemaDoc = await create({ content: stringMapSchema, metadata: { controllers } }, ceramic, context)
      await anchorUpdate(anchorService, schemaDoc)

      const conformingContent = {stuff: 'foo'}
      const nonConformingContent = {stuff: 1}
      const docParams = {
        content: conformingContent,
        metadata: {controllers, schema: schemaDoc.commitId.toString()}
      }
      const doc = await create(docParams, ceramic, context)
      await anchorUpdate(anchorService, doc)

      try {
        const updateRec = await TileDoctype._makeCommit(doc.doctype, user, nonConformingContent, doc.controllers)
        await doc.applyCommit(updateRec)
        fail('Should not be able to assign a schema to a document that does not conform')
      } catch (e) {
        expect(e.message).toEqual('Validation Error: data[\'stuff\'] should be string')
      }
    })

    it('Enforces schema when loading genesis record', async () => {
      const schemaDoc = await create({ content: stringMapSchema, metadata: { controllers } }, ceramic, context)
      await anchorUpdate(anchorService, schemaDoc)

      const docParams = {
        content: {stuff: 1},
        metadata: {controllers, schema: schemaDoc.commitId.toString()}
      }
      // Create a document that isn't conforming to the schema
      const doc = await create(docParams, ceramicWithoutSchemaValidation, context)
      await anchorUpdate(anchorService, doc)

      expect(doc.content).toEqual({stuff:1})
      expect(doc.metadata.schema).toEqual(schemaDoc.commitId.toString())

      try {
        await Document.load(doc.id, doctypeHandler, dispatcher, pinStore, context, { sync: false })
        fail("Should not be able to load a document that doesn't conform to its schema")
      } catch (e) {
        expect(e.message).toEqual('Validation Error: data[\'stuff\'] should be string')
      }
    })
  })

  describe('Conflict resolution logic', () => {
    let cids: CID[];

    beforeEach(() => {
      // Provide a random group of CIDs to work with, in increasing lexicographic order
      const makeCID = (data: string): CID => {
        const body = uint8arrays.concat([uint8arrays.fromString('1220', 'base16'), sha256.hash(uint8arrays.fromString(data))])
        return new CID(1, 'sha2-256', body)
      }
      cids = [makeCID("aaaa"),
              makeCID("bbbb"),
              makeCID("cccc"),
              makeCID("dddd"),
              makeCID("eeeee")]
      cids.sort(function (cid1, cid2) {
        if (cid1.bytes < cid2.bytes) {
          return -1
        } else if (cid1.bytes > cid2.bytes) {
          return 1
        } else {
          return 0
        }
      })
    })

    it("Neither log is anchored, same log lengths", async () => {
      const state1 = {
        anchorStatus: AnchorStatus.NOT_REQUESTED,
        log: [{cid: cids[1]}, {cid: cids[2]}],
        metadata: {},
      }

      const state2 = {
        anchorStatus: AnchorStatus.PENDING,
        log: [{cid: cids[4]}, {cid: cids[0]}],
        metadata: {},
      }

      // When neither log is anchored and log lengths are the same we should pick the log whose last entry has the
      // smaller CID.
      expect(await Document._pickLogToAccept(state1, state2)).toEqual(state2)
      expect(await Document._pickLogToAccept(state2, state1)).toEqual(state2)
    })

    it("Neither log is anchored, different log lengths", async () => {
      const state1 = {
        anchorStatus: AnchorStatus.NOT_REQUESTED,
        log: [{cid: cids[1]}, {cid: cids[2]}, {cid: cids[3]}],
        metadata: {},
      }

      const state2 = {
        anchorStatus: AnchorStatus.PENDING,
        log: [{cid: cids[4]}, {cid: cids[0]}],
        metadata: {},
      }

      // When neither log is anchored and log lengths are different we should pick the log with greater length
      expect(await Document._pickLogToAccept(state1, state2)).toEqual(state1)
      expect(await Document._pickLogToAccept(state2, state1)).toEqual(state1)
    })

    it("One log anchored before the other", async () => {
      const state1 = {
        anchorStatus: AnchorStatus.PENDING,
      }

      const state2 = {
        anchorStatus: AnchorStatus.ANCHORED,
      }

      // When only one of the logs has been anchored, we pick the anchored one
      expect(await Document._pickLogToAccept(state1, state2)).toEqual(state2)
      expect(await Document._pickLogToAccept(state2, state1)).toEqual(state2)
    })

    it("Both logs anchored in different blockchains", async () => {
      const proof1 = {
        chainId: 'chain1',
        blockTimestamp: 5,
      }
      const state1 = {
        anchorStatus: AnchorStatus.ANCHORED,
        anchorProof: proof1,
      }

      const proof2 = {
        chainId: 'chain2',
        blockTimestamp: 10,
      }
      const state2 = {
        anchorStatus: AnchorStatus.ANCHORED,
        anchorProof: proof2,
      }

      // We do not currently support multiple blockchains
      await expect(Document._pickLogToAccept(state1, state2)).rejects.toThrow("Conflicting logs on the same document are anchored on different chains. Chain1: chain1, chain2: chain2")
      await expect(Document._pickLogToAccept(state2, state1)).rejects.toThrow("Conflicting logs on the same document are anchored on different chains. Chain1: chain2, chain2: chain1")
    })

    it("Both logs anchored in same blockchains in different blocks", async () => {
      const proof1 = {
        chainId: 'myblockchain',
        blockNumber: 10,
      }
      const state1 = {
        anchorStatus: AnchorStatus.ANCHORED,
        anchorProof: proof1,
      }

      const proof2 = {
        chainId: 'myblockchain',
        blockNumber: 5,
      }
      const state2 = {
        anchorStatus: AnchorStatus.ANCHORED,
        anchorProof: proof2,
      }

      // When anchored in the same blockchain, should take log with earlier block number
      expect(await Document._pickLogToAccept(state1, state2)).toEqual(state2)
      expect(await Document._pickLogToAccept(state2, state1)).toEqual(state2)
    })

    it("Both logs anchored in same blockchains in the same block with different log lengths", async () => {
      const proof1 = {
        chainId: 'myblockchain', blockNumber: 10,
      }
      const state1 = {
        anchorStatus: AnchorStatus.ANCHORED,
        anchorProof: proof1, metadata: {},
        log: [{ cid: cids[1] }, { cid: cids[2] }, { cid: cids[3] }],
      }

      const proof2 = {
        chainId: 'myblockchain', blockNumber: 10,
      }
      const state2 = {
        anchorStatus: AnchorStatus.ANCHORED,
        anchorProof: proof2,
        metadata: {},
        log: [{ cid: cids[4] }, { cid: cids[0] }],
      }

      // When anchored in the same blockchain, same block, and with same log lengths, we should choose the one with
      // longer log length
      expect(await Document._pickLogToAccept(state1, state2)).toEqual(state1)
      expect(await Document._pickLogToAccept(state2, state1)).toEqual(state1)
    })

    it("Both logs anchored in same blockchains in the same block with same log lengths", async () => {
      const proof1 = {
        chainId: 'myblockchain', blockNumber: 10,
      }
      const state1 = {
        anchorStatus: AnchorStatus.ANCHORED,
        anchorProof: proof1, metadata: {},
        log: [{ cid: cids[1] }, { cid: cids[2] }],
      }

      const proof2 = {
        chainId: 'myblockchain', blockNumber: 10,
      }
      const state2 = {
        anchorStatus: AnchorStatus.ANCHORED,
        anchorProof: proof2,
        metadata: {},
        log: [{ cid: cids[4] }, { cid: cids[0] }],
      }

      // When anchored in the same blockchain, same block, and with same log lengths, we should use
      // the fallback mechanism of picking the log whose last entry has the smaller CID
      expect(await Document._pickLogToAccept(state1, state2)).toEqual(state2)
      expect(await Document._pickLogToAccept(state2, state1)).toEqual(state2)
    })
  })

  describe('Network update logic', () => {
    const initialContent = { abc: 123, def: 456 }
    const newContent = { abc: 321, def: 456, gh: 987 }
    const controllers = ['did:3:k2t6wyfsu4pg0t2n4j8ms3s33xsgqjhtto04mvq8w5a2v5xo48idyz38l7ydki']

    let dispatcher: any;
    let doctypeHandler: TileDoctypeHandler;
    let anchorService: AnchorService;
    let context: Context;
    let ceramic: Ceramic;
    let user: DID;

    beforeEach(async () => {
      dispatcher = Dispatcher(true)
      anchorService = new InMemoryAnchorService({})
      anchorService.ceramic = {
        dispatcher,
      }
      user = new DID()
      user.createJWS = jest.fn(async () => {
        // fake jws
        return { payload: 'bbbb', signatures: [{ protected: 'eyJraWQiOiJkaWQ6MzprMnQ2d3lmc3U0cGcwdDJuNGo4bXMzczMzeHNncWpodHRvMDRtdnE4dzVhMnY1eG80OGlkeXozOGw3eWRraT92ZXJzaW9uPTAjc2lnbmluZyIsImFsZyI6IkVTMjU2SyJ9', signature: 'cccc'}]}
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
      const loggerProvider = new LoggerProvider()
      const repository = new Repository()
      context = {
        did: user,
        anchorService,
        ipfs: dispatcher._ipfs,
        loggerProvider,
        resolver,
        provider: null,
      }

      const networkOptions = {
        name: 'inmemory',
        pubsubTopic: '/ceramic/inmemory',
      }
      const topology = new FakeTopology(dispatcher._ipfs, networkOptions.name, loggerProvider.getDiagnosticsLogger())

      const pinStoreFactory = {
        createPinStore: async() => {
          return pinStore
        }
      };
      const modules = {
        anchorService,
        didResolver: resolver,
        dispatcher,
        ipfs: dispatcher._ipfs,
        ipfsTopology: topology,
        loggerProvider,
        pinStoreFactory: pinStoreFactory as any as PinStoreFactory,
        pinningBackends: null,
        repository
      }

      const params = {
        cacheDocumentCommits: true,
        docCacheLimit: 100,
        networkOptions,
        supportedChains: ['inmemory:12345'],
        pinStoreOptions: null,
        validateDocs: true,
      }

      ceramic = new Ceramic(modules, params)
      ceramic._doctypeHandlers['tile'] = doctypeHandler
      ceramic.context.resolver = resolver
      context.api = ceramic
      await ceramic._init(false, false)
    })

    it('should announce change to network', async () => {
      const doc1 = await create({ content: initialContent, metadata: { controllers, tags: ['3id'] } }, ceramic, context)
      expect(dispatcher.publishTip).toHaveBeenCalledTimes(1)
      expect(dispatcher.publishTip).toHaveBeenCalledWith(doc1.id, doc1.tip)
      await anchorUpdate(anchorService, doc1)

      const updateRec = await TileDoctype._makeCommit(doc1.doctype, user, newContent, doc1.controllers)
      await doc1.applyCommit(updateRec)

      expect(doc1.content).toEqual(newContent)

      expect(dispatcher.publishTip).toHaveBeenCalledTimes(3)
      expect(dispatcher.publishTip).toHaveBeenCalledWith(doc1.id, doc1.tip)
    })

    it('documents share updates', async () => {
      const doc1 = await create({ content: initialContent, metadata: { controllers, tags: ['3id'] } }, ceramic, context)
      await anchorUpdate(anchorService, doc1)
      const doc2 = await Document.load(doc1.id, doctypeHandler, dispatcher, pinStore, context, { sync: false })

      const updatePromise = new Promise(resolve => {
        doc2.doctype.on('change', resolve)
      })

      const updateRec = await TileDoctype._makeCommit(doc1.doctype, user, newContent, doc1.controllers)
      await doc1.applyCommit(updateRec)

      expect(doc1.content).toEqual(newContent)

      await updatePromise
      expect(doc2.content).toEqual(newContent)
    })

    it('should publish tip on network request', async () => {
      const doc = await create({ content: initialContent, metadata: { controllers, tags: ['3id'] } }, ceramic, context)
      expect(dispatcher.publishTip).toHaveBeenCalledTimes(1)
      expect(dispatcher.publishTip).toHaveBeenNthCalledWith(1, doc.id, doc.tip)

      await dispatcher._requestTip(doc.id)

      expect(dispatcher.publishTip).toHaveBeenCalledTimes(2)
      expect(dispatcher.publishTip).toHaveBeenNthCalledWith(2, doc.id, doc.tip)

      // wait a bit to complete document handling
      await new Promise(resolve => setTimeout(resolve, 1000))
    })
  })
})
