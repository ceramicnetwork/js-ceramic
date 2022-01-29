import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import {
  AnchorProof,
  CommitType,
  IpfsApi,
  SignedCommitContainer,
  TestUtils,
} from '@ceramicnetwork/common'
import { DidPublishDocument, DidPublishDocumentHandler } from '../did-publish.js'
import { createCeramic } from './create-ceramic.js'
import * as dagCBOR from '@ipld/dag-cbor'
import { CID } from 'multiformats/cid'
import { Ceramic } from '../ceramic.js'
import * as fs from 'node:fs/promises'

let ipfs: IpfsApi
let ceramic: Ceramic

beforeEach(async () => {
  ipfs = await createIPFS()
  ceramic = await createCeramic(ipfs, {
    seed: 'foo',
  })
})

afterEach(async () => {
  await ceramic.close()
  await ipfs.stop()
})

test('makeGenesis', async () => {
  const commit = (await DidPublishDocument.makeGenesis(ceramic, {
    hello: 'world',
  })) as SignedCommitContainer
  expect(commit).toBeDefined()
  const linkedBlock = commit.linkedBlock
  expect(linkedBlock).toBeDefined()
  const payload = dagCBOR.decode<any>(linkedBlock)
  const data = payload.data
  expect(data).toMatchSnapshot()
})

test('apply genesis commit', async () => {
  const handler = new DidPublishDocumentHandler()

  const content = { hello: 'world' }
  await ceramic.dispatcher._ipfs.dag.put(content) // we need car file support!!
  const commit = (await DidPublishDocument.makeGenesis(ceramic, {
    hello: 'world',
  })) as SignedCommitContainer
  const commitCid = await ceramic.dispatcher.storeCommit(commit)
  const payload = dagCBOR.decode(commit.linkedBlock)
  const commitData = {
    cid: commitCid,
    type: CommitType.GENESIS,
    commit: payload,
    envelope: commit.jws,
  }
  const streamState = await handler.applyCommit(commitData, ceramic)
  delete streamState.metadata.unique
  delete streamState.log // uniqueness
  expect(streamState).toMatchSnapshot()
})

test('apply signed commit', async () => {
  const handler = new DidPublishDocumentHandler()

  const content0 = { hello: 'world' }
  await ceramic.dispatcher._ipfs.dag.put(content0) // we need car file support!!
  const commit = (await DidPublishDocument.makeGenesis(ceramic, {
    hello: 'world',
  })) as SignedCommitContainer
  const commitCid = await ceramic.dispatcher.storeCommit(commit)
  const payload = dagCBOR.decode(commit.linkedBlock)
  const commitData = {
    cid: commitCid,
    type: CommitType.GENESIS,
    commit: payload,
    envelope: commit.jws,
  }
  const streamState0 = await handler.applyCommit(commitData, ceramic)
  const state$ = TestUtils.runningState(streamState0)

  const doc = new DidPublishDocument(state$, ceramic)
  const content1 = { james: 'bond' }
  await ceramic.dispatcher._ipfs.dag.put(content1)
  const signedCommit = (await doc.makeCommit(ceramic, content1)) as SignedCommitContainer
  const commitCid1 = await ceramic.dispatcher.storeCommit(signedCommit)

  const sPayload = dagCBOR.decode(signedCommit.linkedBlock)
  await ceramic.dispatcher._ipfs.dag.put(sPayload, signedCommit.jws.link)

  // apply signed
  const signedCommitData = {
    cid: commitCid1,
    type: CommitType.SIGNED,
    commit: sPayload,
    envelope: signedCommit.jws,
  }
  const state1 = await handler.applyCommit(signedCommitData, ceramic, state$.state)

  delete state1.metadata.unique
  delete state1.log // uniqueness
  delete state1.next.metadata.unique
  expect(state1).toMatchSnapshot()
})

test('anchor commit', async () => {
  const handler = new DidPublishDocumentHandler()

  const content0 = { hello: 'world' }
  await ceramic.dispatcher._ipfs.dag.put(content0) // we need car file support!!
  const commit = (await DidPublishDocument.makeGenesis(ceramic, {
    hello: 'world',
  })) as SignedCommitContainer
  const commitCid = await ceramic.dispatcher.storeCommit(commit)
  const payload = dagCBOR.decode(commit.linkedBlock)
  const commitData = {
    cid: commitCid,
    type: CommitType.GENESIS,
    commit: payload,
    envelope: commit.jws,
  }
  const streamState0 = await handler.applyCommit(commitData, ceramic)
  const state$ = TestUtils.runningState(streamState0)

  const doc = new DidPublishDocument(state$, ceramic)
  const content1 = { james: 'bond' }
  await ceramic.dispatcher._ipfs.dag.put(content1)
  const signedCommit = (await doc.makeCommit(ceramic, content1)) as SignedCommitContainer
  const commitCid1 = await ceramic.dispatcher.storeCommit(signedCommit)

  const sPayload = dagCBOR.decode(signedCommit.linkedBlock)
  await ceramic.dispatcher._ipfs.dag.put(sPayload, signedCommit.jws.link)

  // apply signed
  const signedCommitData = {
    cid: commitCid1,
    type: CommitType.SIGNED,
    commit: sPayload,
    envelope: signedCommit.jws,
  }
  const state1 = await handler.applyCommit(signedCommitData, ceramic, state$.state)

  const proof = {
    blockNumber: 123456,
    blockTimestamp: 1615799679,
    chainId: 'fakechain:123',
  } as AnchorProof
  const FAKE_CID_4 = CID.parse('bafybeig6xv5nwphfmvcnektpnojts66jqcuam7bmye2pb54adnrtccjlsu')
  const proofCid = await ceramic.dispatcher._ipfs.dag.put(proof)
  // apply anchor
  const anchorCommitData = {
    cid: FAKE_CID_4,
    type: CommitType.ANCHOR,
    commit: {
      proof: proofCid,
    },
    proof: proof,
  }
  const state2 = await handler.applyCommit(anchorCommitData, ceramic, state1)
  expect(state2.log.length).toEqual(3)
  delete state2.metadata.unique
  delete state2.log // uniqueness
  expect(state2).toMatchSnapshot()
})

test('update flow', async () => {
  const content0 = { hello: 'world-0' }
  await ceramic.dispatcher._ipfs.dag.put(content0) // we definitely need car file support
  const t = await DidPublishDocument.create(ceramic, content0)
  expect(t.content).toEqual(content0)
  const content1 = { hello: 'world-1' }
  await ceramic.dispatcher._ipfs.dag.put(content1) // we absolutely definitely need car file support. that's annoying
  await t.update(content1)
  expect(t.content).toEqual(content1)
})

test('execution flow', async () => {
  // Upload streamcode
  const scriptContent = await fs.readFile(new URL('../did-publish-script.js', import.meta.url))
  const scriptCid = await ceramic.dispatcher._ipfs.dag.put({
    name: 'fancy script',
    code: scriptContent,
  })
  // Create tile
  const content0 = { hello: 'world-0' }
  await ceramic.dispatcher._ipfs.dag.put(content0) // we absolutely definitely need car file support. that's annoying
  const t = await DidPublishDocument.create(ceramic, content0, { code: scriptCid })
  const content1 = { hello: 'world-1' }
  await ceramic.dispatcher._ipfs.dag.put(content1) // we absolutely definitely need car file support. that's annoying
  await t.update(content1)
})
