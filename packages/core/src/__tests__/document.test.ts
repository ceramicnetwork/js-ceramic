import CID from 'cids'
import { Document } from '../document'
import tmp from 'tmp-promise'
import { Dispatcher } from '../dispatcher'
import Ceramic from "../ceramic"
import { Context, LoggerProvider, PinningBackend } from "@ceramicnetwork/common"
import { AnchorStatus, DocOpts, SignatureStatus } from "@ceramicnetwork/common"
import { TileDoctype, TileParams } from "@ceramicnetwork/doctype-tile"
import { TileDoctypeHandler } from '@ceramicnetwork/doctype-tile-handler'
import { PinStore } from "../store/pin-store";
import { LevelStateStore } from "../store/level-state-store";
import { DID } from "dids"

import { Resolver } from "did-resolver"
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'

jest.mock('../store/level-state-store')

import InMemoryAnchorService from "../anchor/memory/in-memory-anchor-service"
import {FakeTopology} from "./fake-topology";
import {PinStoreFactory} from "../store/pin-store-factory";
import { Repository } from '../state-management/repository';
import { Pubsub } from '../pubsub/pubsub';
import { RunningState } from '../state-management/running-state';

jest.mock('../dispatcher', () => {
  const CID = require('cids') // eslint-disable-line @typescript-eslint/no-var-requires
  const cloneDeep = require('lodash.clonedeep') // eslint-disable-line @typescript-eslint/no-var-requires
  const sha256 = require('@stablelib/sha256') // eslint-disable-line @typescript-eslint/no-var-requires
  const { DoctypeUtils } = require('@ceramicnetwork/common') // eslint-disable-line @typescript-eslint/no-var-requires
  const dagCBOR = require('ipld-dag-cbor') // eslint-disable-line @typescript-eslint/no-var-requires
  const u8a = require('uint8arrays') // eslint-disable-line @typescript-eslint/no-var-requires
  const { MessageBus } = require('../pubsub/message-bus') // eslint-disable-line @typescript-eslint/no-var-requires
  const { from } = require('rxjs') // eslint-disable-line @typescript-eslint/no-var-requires
  const hash = (data: string): CID => {
    const body = u8a.concat([u8a.fromString('1220', 'base16'), sha256.hash(u8a.fromString(data))])
    return new CID(1, 'sha2-256', body)
  }
  const Dispatcher = (gossip: boolean, docs: Record<string, Document> = {}): any => {
    const recs: Record<any, any> = {}
    const pubsub = from([]) as unknown as Pubsub
    pubsub.next = jest.fn()
    const messageBus = new MessageBus(pubsub)
    return {
      messageBus,
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
      publishTip: jest.fn(),
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
      close: () => {
        messageBus.unsubscribe();
      }
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
  return ceramic._createDocFromGenesis("tile", record, opts)
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
  pinStore.open('fakeNetwork')
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
    let repository: Repository

    beforeEach(async () => {
      dispatcher = Dispatcher(false)
      anchorService = new InMemoryAnchorService({anchorOnRequest:false, verifySignatures: false})
      doctypeHandler = new TileDoctypeHandler()
      // TODO - we should probably do this more properly.
      // Would require larger rewrite of this test.
      doctypeHandler._verifySignature = async (): Promise<void> => { return }

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
      user = new DID({ resolver })
      user.createJWS = jest.fn(async () => {
        // fake jws
        return { payload: 'bbbb', signatures: [{ protected: 'eyJraWQiOiJkaWQ6MzprMnQ2d3lmc3U0cGcwdDJuNGo4bXMzczMzeHNncWpodHRvMDRtdnE4dzVhMnY1eG80OGlkeXozOGw3eWRraT92ZXJzaW9uPTAjc2lnbmluZyIsImFsZyI6IkVTMjU2SyJ9', signature: 'cccc'}]}
      })
      user._id = 'did:3:k2t6wyfsu4pg0t2n4j8ms3s33xsgqjhtto04mvq8w5a2v5xo48idyz38l7ydki'
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

      repository = new Repository(100)
      const pinStoreFactory = {
        createPinStore: () => {
          return pinStore
        }
      } as unknown as PinStoreFactory;
      const modules = {
        anchorService,
        didResolver: resolver,
        dispatcher,
        ipfs: dispatcher._ipfs,
        ipfsTopology: topology,
        loggerProvider,
        pinStoreFactory: pinStoreFactory,
        pinStore: pinStore,
        repository
      }

      const params = {
        cacheDocumentCommits: true,
        docCacheLimit: 100,
        networkOptions,
        supportedChains: ['inmemory:12345'],
        validateDocs: true,
      }

      ceramic = new Ceramic(modules, params);
      (ceramic as any)._doctypeHandlers.add(doctypeHandler)
      ceramic.context.resolver = resolver
      context.api = ceramic
      await ceramic._init(false, false)

      const paramsNoSchemaValidation = { ...params, validateDocs: false };
      const modulesNoSchemaValidation = {...modules, repository: new Repository(100)}
      ceramicWithoutSchemaValidation = new Ceramic(modulesNoSchemaValidation, paramsNoSchemaValidation);
      (ceramicWithoutSchemaValidation as any)._doctypeHandlers.add(doctypeHandler)
      ceramicWithoutSchemaValidation.context.resolver = resolver

      await ceramicWithoutSchemaValidation._init(false, false)
    })

    it('is created correctly', async () => {
      const queryNetworkSpy = jest.spyOn(dispatcher.messageBus, 'queryNetwork')
      const doc = await create({ content: initialContent, metadata: { controllers, tags: ['3id'] } }, ceramic, context)

      expect(doc.doctype.content).toEqual(initialContent)
      expect(queryNetworkSpy).toHaveBeenCalledWith(doc.id)
      expect(doc.state.anchorStatus).toEqual(AnchorStatus.PENDING)
      await anchorUpdate(anchorService, doc)
      expect(doc.state.anchorStatus).not.toEqual(AnchorStatus.NOT_REQUESTED)
    })

    it('is loaded correctly', async () => {
      const doc1 = await create({ content: initialContent, metadata: { controllers, tags: ['3id'] } }, ceramic, context, { anchor: false, publish: false, sync: false })
      const doc2 = await repository.load(doc1.id, {sync: false})

      expect(doc1.id).toEqual(doc2.id)
      expect(doc1.doctype.content).toEqual(initialContent)
      expect(doc1.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)
    })

    it('handles new tip correctly', async () => {
      const tmpDoc = await create({ content: initialContent, metadata: { controllers, tags: ['3id'] } }, ceramic, context)
      await anchorUpdate(anchorService, tmpDoc)
      const docId = tmpDoc.id
      const log = tmpDoc.state.log

      const initialState = await tmpDoc.rewind(docId.atCommit(docId.cid)).then(doc => doc.state)
      const doc = new Document(new RunningState(initialState), dispatcher, pinStore, true, context, doctypeHandler)
      expect(doc.doctype.content).toEqual(initialContent)
      expect(doc.state).toEqual(expect.objectContaining({ signature: SignatureStatus.SIGNED, anchorStatus: 0 }))
      // _handleTip is intended to be called by the dispatcher
      // should return a promise that resolves when tip is added
      await doc._handleTip(log[1].cid)
      expect(doc.state.signature).toEqual(SignatureStatus.SIGNED)
      expect(doc.state.anchorStatus).not.toEqual(AnchorStatus.NOT_REQUESTED)
      expect(doc.doctype.content).toEqual(initialContent)
    })

    it('it handles commits correctly (valid, invalid, non-existent)', async () => {
      const doc = await create({ content: initialContent, metadata: { controllers, tags: ['3id'] } }, ceramic, context)

      let commits = doc.doctype.allCommitIds
      let anchorCommits = doc.doctype.anchorCommitIds
      const commit0 = doc.doctype.commitId
      expect(commits).toEqual([commit0])

      expect(commit0.equals(doc.id.atCommit(doc.id.cid))).toBeTruthy()
      expect(anchorCommits.length).toEqual(0)

      await anchorUpdate(anchorService, doc)

      commits = doc.doctype.allCommitIds
      anchorCommits = doc.doctype.anchorCommitIds
      expect(commits.length).toEqual(2)
      expect(anchorCommits.length).toEqual(1)
      const commit1 = doc.doctype.commitId
      expect(commit1.equals(commit0)).toBeFalsy()
      expect(commit1).toEqual(commits[1])
      expect(commit1).toEqual(anchorCommits[0])

      const updateRec = await TileDoctype._makeCommit(doc.doctype, user, newContent, doc.doctype.controllers)

      commits = doc.doctype.allCommitIds
      anchorCommits = doc.doctype.anchorCommitIds
      expect(commits.length).toEqual(2)
      expect(anchorCommits.length).toEqual(1)

      await doc.applyCommit(updateRec)

      commits = doc.doctype.allCommitIds
      anchorCommits = doc.doctype.anchorCommitIds
      expect(commits.length).toEqual(3)
      expect(anchorCommits.length).toEqual(1)
      const commit2 = doc.doctype.commitId
      expect(commit2.equals(commit1)).toBeFalsy()
      expect(commit2).toEqual(commits[2])

      await anchorUpdate(anchorService, doc)

      commits = doc.doctype.allCommitIds
      anchorCommits = doc.doctype.anchorCommitIds
      expect(commits.length).toEqual(4)
      expect(anchorCommits.length).toEqual(2)
      const commit3 = doc.doctype.commitId
      expect(commit3.equals(commit2)).toBeFalsy()
      expect(commit3).toEqual(commits[3])
      expect(commit3).toEqual(anchorCommits[1])

      expect(doc.doctype.content).toEqual(newContent)
      expect(doc.state.signature).toEqual(SignatureStatus.SIGNED)
      expect(doc.state.anchorStatus).not.toEqual(AnchorStatus.NOT_REQUESTED)

      // Apply a final record that never gets anchored and thus never becomes a proper commit
      const finalContent = {foo: 'bar'}
      const updateRec2 = await TileDoctype._makeCommit(doc.doctype, user, finalContent, doc.doctype.controllers)
      await doc.applyCommit(updateRec2)

      commits = doc.doctype.allCommitIds
      anchorCommits = doc.doctype.anchorCommitIds
      expect(commits.length).toEqual(5)
      expect(anchorCommits.length).toEqual(2)
      const commit4 = doc.doctype.commitId
      expect(commit4.equals(commit3)).toBeFalsy()
      expect(commit4).toEqual(commits[4])
      expect(commit4.equals(anchorCommits[1])).toBeFalsy()
      expect(doc.state.log.length).toEqual(5)

      // try to load a non-existing commit
      const nonExistentCommitID = doc.id.atCommit(new CID('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu'))
      try {
        await doc.rewind(nonExistentCommitID)
        fail('Should not be able to fetch non-existing commit')
      } catch (e) {
        expect(e.message).toContain(`No commit found for CID ${nonExistentCommitID.commit?.toString()}`)
      }

      // Correctly check out a specific commit
      const docV0 = await doc.rewind(commit0);
      expect(docV0.id.equals(commit0.baseID)).toBeTruthy()
      expect(docV0.state.log.length).toEqual(1)
      expect(docV0.doctype.controllers).toEqual(controllers)
      expect(docV0.doctype.content).toEqual(initialContent)
      expect(docV0.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)

      const docV1 = await doc.rewind(commit1);
      expect(docV1.id.equals(commit1.baseID)).toBeTruthy()
      expect(docV1.state.log.length).toEqual(2)
      expect(docV1.doctype.controllers).toEqual(controllers)
      expect(docV1.doctype.content).toEqual(initialContent)
      expect(docV1.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      const docV2 = await doc.rewind(commit2);
      expect(docV2.id.equals(commit2.baseID)).toBeTruthy()
      expect(docV2.state.log.length).toEqual(3)
      expect(docV2.doctype.controllers).toEqual(controllers)
      expect(docV2.doctype.content).toEqual(newContent)
      expect(docV2.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)

      const docV3 = await doc.rewind(commit3);
      expect(docV3.id.equals(commit3.baseID)).toBeTruthy()
      expect(docV3.state.log.length).toEqual(4)
      expect(docV3.doctype.controllers).toEqual(controllers)
      expect(docV3.doctype.content).toEqual(newContent)
      expect(docV3.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      const docV4 = await doc.rewind(commit4);
      expect(docV4.id.equals(commit4.baseID)).toBeTruthy()
      expect(docV4.state.log.length).toEqual(5)
      expect(docV4.doctype.controllers).toEqual(controllers)
      expect(docV4.doctype.content).toEqual(finalContent)
      expect(docV4.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)

      // try to call doctype.change on doc that's tied to a specific commit
      try {
        await docV4.doctype.change({ content: doc.doctype.content, controllers: doc.doctype.controllers })
        fail('Should not be able to change document that was loaded at a specific commit')
      } catch (e) {
        expect(e.message).toEqual('Historical document commits cannot be modified. Load the document without specifying a commit to make updates.')
      }
    })

    it('is updated correctly', async () => {
      const doc = await create({ content: initialContent, metadata: { controllers, tags: ['3id'] } }, ceramic, context)
      await anchorUpdate(anchorService, doc)

      const updateRec = await TileDoctype._makeCommit(doc.doctype, user, newContent, doc.doctype.controllers)
      await doc.applyCommit(updateRec)

      await anchorUpdate(anchorService, doc)
      expect(doc.doctype.content).toEqual(newContent)
      expect(doc.state.signature).toEqual(SignatureStatus.SIGNED)
      expect(doc.state.anchorStatus).not.toEqual(AnchorStatus.NOT_REQUESTED)
    })

    it('handles basic conflict', async () => {
      const doc1 = await create({ content: initialContent, metadata: { controllers, tags: ['3id'] } }, ceramic, context)
      const docId = doc1.id
      await anchorUpdate(anchorService, doc1)
      const tipPreUpdate = doc1.tip

      let updateRec = await TileDoctype._makeCommit(doc1.doctype, user, newContent, doc1.doctype.controllers)
      await doc1.applyCommit(updateRec)

      await anchorUpdate(anchorService, doc1)
      expect(doc1.doctype.content).toEqual(newContent)
      const tipValidUpdate = doc1.tip
      // create invalid change that happened after main change

      const initialState = await doc1.rewind(docId.atCommit(docId.cid)).then(doc => doc.state)
      const doc2 = new Document(new RunningState(initialState), dispatcher, pinStore, true, context, doctypeHandler)
      await doc2._handleTip(tipPreUpdate)
      // add short wait to get different anchor time
      // sometime the tests are very fast
      await new Promise(resolve => setTimeout(resolve, 1))
      // TODO - better mock for anchors

      const conflictingNewContent = { asdf: 2342 }
      updateRec = await TileDoctype._makeCommit(doc2.doctype, user, conflictingNewContent, doc2.doctype.controllers)
      await doc2.applyCommit(updateRec)

      await anchorUpdate(anchorService, doc2)
      const tipInvalidUpdate = doc2.tip
      expect(doc2.doctype.content).toEqual(conflictingNewContent)
      // loading tip from valid log to doc with invalid
      // log results in valid state
      await doc2._handleTip(tipValidUpdate)
      expect(doc2.doctype.content).toEqual(newContent)

      // loading tip from invalid log to doc with valid
      // log results in valid state
      await doc1._handleTip(tipInvalidUpdate)
      expect(doc1.doctype.content).toEqual(newContent)

      // Loading valid commit works
      const docAtValidCommit = await doc1.rewind(docId.atCommit(tipValidUpdate));
      expect(docAtValidCommit.doctype.content).toEqual(newContent)

      // Loading invalid commit fails
      await expect(doc1.rewind(docId.atCommit(tipInvalidUpdate))).rejects.toThrow(
          `Requested commit CID ${tipInvalidUpdate.toString()} not found in the log for document ${docId.toString()}`
      )
    })

    it('handles consecutive anchors', async () => {
      const doc = await create({ content: initialContent, metadata: { controllers, tags: ['3id'] } }, ceramic, context)

      const updateRec = await TileDoctype._makeCommit(doc.doctype, user, newContent, doc.doctype.controllers)
      await doc.applyCommit(updateRec)

      await anchorUpdate(anchorService, doc)
      expect(doc.doctype.content).toEqual(newContent)
      expect(doc.state.log).toHaveLength(3)
      expect(doc.state.signature).toEqual(SignatureStatus.SIGNED)
      expect(doc.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    })

    it('Enforces schema at document creation', async () => {
      const schemaDoc = await create({ content: stringMapSchema, metadata: { controllers } }, ceramic, context)
      await anchorUpdate(anchorService, schemaDoc)

      const docParams = {
        content: {stuff: 1},
        metadata: {controllers, schema: schemaDoc.doctype.commitId.toString()}
      }

      await expect(create(docParams, ceramic, context)).rejects.toThrow("Validation Error: data['stuff'] should be string")
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
        const updateRec = await TileDoctype._makeCommit(doc.doctype, user, null, doc.doctype.controllers, schemaDoc.doctype.commitId.toString())
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
        metadata: {controllers, schema: schemaDoc.doctype.commitId.toString()}
      }
      const doc = await create(docParams, ceramic, context)
      await anchorUpdate(anchorService, doc)

      try {
        const updateRec = await TileDoctype._makeCommit(doc.doctype, user, nonConformingContent, doc.doctype.controllers)
        await doc.applyCommit(updateRec)
        fail('Should not be able to assign a schema to a document that does not conform')
      } catch (e) {
        expect(e.message).toEqual('Validation Error: data[\'stuff\'] should be string')
      }
    })
  })

  describe('Network update logic', () => {
    const initialContent = { abc: 123, def: 456 }
    const newContent = { abc: 321, def: 456, gh: 987 }
    const controllers = ['did:3:k2t6wyfsu4pg0t2n4j8ms3s33xsgqjhtto04mvq8w5a2v5xo48idyz38l7ydki']

    let dispatcher: any;
    let doctypeHandler: TileDoctypeHandler;
    let anchorService: InMemoryAnchorService;
    let context: Context;
    let ceramic: Ceramic;
    let user: DID;
    const docs = {}
    const gossip = true

    beforeEach(async () => {
      dispatcher = Dispatcher(gossip, docs)
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
      // TODO - we should probably do this more properly.
      // Would require larger rewrite of this test.
      doctypeHandler._verifySignature = async (): Promise<void> => { return }

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
      const repository = new Repository(100)
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
        createPinStore: () => {
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
        pinStoreFactory: pinStoreFactory,
        pinStore: pinStore,
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

      ceramic = new Ceramic(modules, params);
      (ceramic as any)._doctypeHandlers.add(doctypeHandler)
      ceramic.context.resolver = resolver
      context.api = ceramic
      await ceramic._init(false, false)
    })

    afterEach(async () => {
      await ceramic.close();
    })

    it('should announce change to network', async () => {
      const doc1 = await create({ content: initialContent, metadata: { controllers, tags: ['3id'] } }, ceramic, context)
      expect(dispatcher.publishTip).toHaveBeenCalledTimes(1)
      expect(dispatcher.publishTip).toHaveBeenCalledWith(doc1.id, doc1.tip)
      await anchorUpdate(anchorService, doc1)

      const updateRec = await TileDoctype._makeCommit(doc1.doctype, user, newContent, doc1.doctype.controllers)
      await doc1.applyCommit(updateRec)

      expect(doc1.doctype.content).toEqual(newContent)

      expect(dispatcher.publishTip).toHaveBeenCalledTimes(3)
      expect(dispatcher.publishTip).toHaveBeenCalledWith(doc1.id, doc1.tip)
    })
  })
})
