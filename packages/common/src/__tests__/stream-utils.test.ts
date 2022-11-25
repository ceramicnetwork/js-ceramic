import { CID } from 'multiformats/cid'
import { AnchorStatus, CommitType, RawCommit, SignatureStatus, StreamState } from '../stream.js'
import { StreamID } from '@ceramicnetwork/streamid'
import { StreamUtils } from '../utils/stream-utils.js'
import { exec } from 'child_process'

const FAKE_DID = 'did:3:k2t6wyfsu4pg0t2n4j8ms3s33xsgqjhtto04mvq8w5a2v5xo48idyz38l7ydki'
const FAKE_CID = CID.parse('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_STREAM_ID = StreamID.fromString(
  'kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s'
)

test('StreamState serialization round trip', async () => {
  const state: StreamState = {
    type: 0,
    content: null,
    metadata: { controllers: [FAKE_DID], model: FAKE_STREAM_ID },
    signature: SignatureStatus.GENESIS,
    anchorStatus: AnchorStatus.NOT_REQUESTED,
    log: [{ cid: FAKE_CID, type: CommitType.GENESIS }],
  }

  const serialized = StreamUtils.serializeState(state)
  const deserialized = StreamUtils.deserializeState(serialized)

  expect(deserialized.type).toEqual(state.type)
  expect(deserialized.content).toEqual(state.content)
  expect(deserialized.metadata.controllers.length).toEqual(state.metadata.controllers.length)
  expect(deserialized.metadata.controllers.length).toEqual(1)
  expect(deserialized.metadata.controllers[0]).toEqual(state.metadata.controllers[0])
  expect(deserialized.metadata.model.type).toEqual(state.metadata.model.type)
  expect(deserialized.metadata.model.cid.toString()).toEqual(state.metadata.model.cid.toString())
  expect(deserialized.signature).toEqual(state.signature)
  expect(deserialized.anchorStatus).toEqual(state.anchorStatus)
  expect(deserialized.log.length).toEqual(state.log.length)
  expect(deserialized.log.length).toEqual(1)
  expect(deserialized.log[0].type).toEqual(state.log[0].type)
  expect(deserialized.log[0].cid.toString()).toEqual(state.log[0].cid.toString())
})

test('Commit serialization round trip - unsigned genesis commit', async () => {
  const commit: RawCommit = {
    id: FAKE_CID,
    data: null,
    prev: null,
    header: { controllers: [FAKE_DID], model: FAKE_STREAM_ID.bytes },
  }

  const serialized = StreamUtils.serializeCommit(commit)
  const deserialized = StreamUtils.deserializeCommit(serialized)

  expect(deserialized.id.toString()).toEqual(commit.id.toString())
  expect(deserialized.data).toEqual(commit.data)
  expect(deserialized.prev).toEqual(commit.prev)
  expect(deserialized.header.controllers.length).toEqual(commit.header.controllers.length)
  expect(deserialized.header.controllers.length).toEqual(1)
  expect(deserialized.header.controllers[0].toString()).toEqual(
    commit.header.controllers[0].toString()
  )
  const deserializedModel = StreamID.fromBytes(deserialized.header.model)
  expect(deserializedModel.type).toEqual(FAKE_STREAM_ID.type)
  expect(deserializedModel.cid.toString()).toEqual(FAKE_STREAM_ID.cid.toString())
})

test('StreamUtils.deserializeState returns null if given null as a param', async () => {
  expect(StreamUtils.deserializeState(null)).toBeNull()
})
