import { jest } from '@jest/globals'
import getPort from 'get-port'
import { AnchorStatus, CeramicApi, CommitType, IpfsApi } from '@ceramicnetwork/common'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { ModelInstanceDocument } from '@ceramicnetwork/stream-model-instance'
import { createCeramic } from '../create-ceramic.js'
import { anchorUpdate } from '@ceramicnetwork/core/lib/state-management/__tests__/anchor-update'
import { Ceramic } from '@ceramicnetwork/core'
import { CeramicDaemon, DaemonConfig } from '@ceramicnetwork/cli'
import { CeramicClient } from '@ceramicnetwork/http-client'
import { StreamID } from '@ceramicnetwork/streamid'
import first from 'it-first'

const FAKE_MODEL_ID = StreamID.fromString(
  'kjzl6hvfrbw6cbclh3fplllid7yvf18w05xw41wvuf9b4lk6q9jkq7d1o01wg6v'
)
const CONTENT0 = { myData: 0 }
const CONTENT1 = { myData: 1 }
const CONTENT2 = { myData: 2 }
const CONTENT3 = { myData: 3 }
const METADATA = { model: FAKE_MODEL_ID }

async function isPinned(ceramic: CeramicApi, streamId: StreamID): Promise<boolean> {
  const iterator = await ceramic.pin.ls(streamId)
  return (await first(iterator)) == streamId.toString()
}

describe('ModelInstanceDocument API http-client tests', () => {
  jest.setTimeout(1000 * 30)

  let ipfs: IpfsApi
  let core: Ceramic
  let daemon: CeramicDaemon
  let ceramic: CeramicClient

  beforeAll(async () => {
    ipfs = await createIPFS()
    core = await createCeramic(ipfs)

    const port = await getPort()
    const apiUrl = 'http://localhost:' + port
    daemon = new CeramicDaemon(core, DaemonConfig.fromObject({ 'http-api': { port } }))
    await daemon.listen()
    ceramic = new CeramicClient(apiUrl)
    ceramic.setDID(core.did)
  }, 12000)

  afterAll(async () => {
    await ceramic.close()
    await daemon.close()
    await core.close()
    await ipfs.stop()
  })

  test('Create valid doc', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, METADATA)

    expect(doc.id.type).toEqual(ModelInstanceDocument.STREAM_TYPE_ID)
    expect(JSON.stringify(doc.content)).toEqual(JSON.stringify(CONTENT0))
    expect(doc.state.log.length).toEqual(1)
    expect(doc.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.PENDING)
    expect(doc.metadata.model.toString()).toEqual(FAKE_MODEL_ID.toString())
    expect(doc.metadata.unique instanceof Uint8Array).toBeTruthy()
    await expect(isPinned(ceramic, doc.id)).resolves.toBeTruthy()
  })

  test('Create and update doc', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, METADATA)
    expect(JSON.stringify(doc.content)).toEqual(JSON.stringify(CONTENT0))

    await doc.replace(CONTENT1)

    expect(JSON.stringify(doc.content)).toEqual(JSON.stringify(CONTENT1))
    expect(doc.state.log.length).toEqual(2)
    expect(doc.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(doc.state.log[1].type).toEqual(CommitType.SIGNED)
  })

  test('Anchor genesis', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, METADATA)
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.PENDING)

    await anchorUpdate(core, doc)
    await doc.sync()

    expect(doc.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(doc.state.log.length).toEqual(2)
    expect(doc.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(doc.state.log[1].type).toEqual(CommitType.ANCHOR)
    expect(JSON.stringify(doc.content)).toEqual(JSON.stringify(CONTENT0))
  })

  test('Anchor after updating', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, METADATA)
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.PENDING)
    await doc.replace(CONTENT1)
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.PENDING)

    await anchorUpdate(core, doc)
    await doc.sync()

    expect(doc.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(doc.state.log.length).toEqual(3)
    expect(doc.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(doc.state.log[1].type).toEqual(CommitType.SIGNED)
    expect(doc.state.log[2].type).toEqual(CommitType.ANCHOR)
    expect(JSON.stringify(doc.content)).toEqual(JSON.stringify(CONTENT1))
  })

  test('multiple updates', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, METADATA)
    await doc.replace(CONTENT1)

    await anchorUpdate(core, doc)
    await doc.sync()

    await doc.replace(CONTENT2)
    await doc.replace(CONTENT3)

    await anchorUpdate(core, doc)
    await doc.sync()

    expect(doc.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(doc.state.log.length).toEqual(6)
    expect(doc.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(doc.state.log[1].type).toEqual(CommitType.SIGNED)
    expect(doc.state.log[2].type).toEqual(CommitType.ANCHOR)
    expect(doc.state.log[3].type).toEqual(CommitType.SIGNED)
    expect(doc.state.log[4].type).toEqual(CommitType.SIGNED)
    expect(doc.state.log[5].type).toEqual(CommitType.ANCHOR)
    expect(JSON.stringify(doc.content)).toEqual(JSON.stringify(CONTENT3))
  })

  test('ModelInstanceDocuments are created uniquely', async () => {
    const doc1 = await ModelInstanceDocument.create(ceramic, CONTENT0, METADATA)
    const doc2 = await ModelInstanceDocument.create(ceramic, CONTENT0, METADATA)

    expect(doc1.id.toString()).not.toEqual(doc2.id.toString())
    expect(doc1.metadata.unique.toString()).not.toEqual(doc2.metadata.unique.toString())
  })

  test('Can load a stream', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, METADATA)
    await doc.replace(CONTENT1)
    await anchorUpdate(core, doc)
    await doc.sync()

    const loaded = await ModelInstanceDocument.load(ceramic, doc.id)

    expect(loaded.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(loaded.state.log.length).toEqual(3)
    expect(JSON.stringify(loaded.state)).toEqual(JSON.stringify(doc.state))
  })

  test('create respects anchor flag', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, METADATA, { anchor: false })
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)
  })

  test('create respects pin flag', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, METADATA, { pin: false })
    await expect(isPinned(ceramic, doc.id)).resolves.toBeFalsy()
  })

  test('replace respects anchor flag', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, METADATA, { anchor: false })
    await doc.replace(CONTENT1, { anchor: false })
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)
  })

  test('replace respects pin flag', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, METADATA)
    await expect(isPinned(ceramic, doc.id)).resolves.toBeTruthy()
    await doc.replace(CONTENT1, { pin: false })
    await expect(isPinned(ceramic, doc.id)).resolves.toBeFalsy()
  })
})

describe('ModelInstanceDocument API multi-node tests', () => {
  jest.setTimeout(1000 * 30)

  let ipfs0: IpfsApi
  let ipfs1: IpfsApi
  let ceramic0: Ceramic
  let ceramic1: Ceramic

  beforeAll(async () => {
    ipfs0 = await createIPFS()
    ipfs1 = await createIPFS()
    ceramic0 = await createCeramic(ipfs0)
    ceramic1 = await createCeramic(ipfs1)
  }, 12000)

  afterAll(async () => {
    await ceramic0.close()
    await ceramic1.close()
    await ipfs0.stop()
    await ipfs1.stop()
  })

  test('load basic doc', async () => {
    const doc = await ModelInstanceDocument.create(ceramic0, CONTENT0, METADATA)

    const loaded = await ModelInstanceDocument.load(ceramic1, doc.id)

    const docState = doc.state
    const loadedState = loaded.state
    expect(docState.anchorStatus).toEqual(AnchorStatus.PENDING)
    expect(loadedState.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)
    delete docState.anchorStatus
    delete loadedState.anchorStatus
    expect(loadedState.log.length).toEqual(1)
    expect(JSON.stringify(loadedState)).toEqual(JSON.stringify(docState))
  })

  test('load updated doc', async () => {
    const doc = await ModelInstanceDocument.create(ceramic0, CONTENT0, METADATA)
    await doc.replace(CONTENT1)

    const loaded = await ModelInstanceDocument.load(ceramic1, doc.id)

    const docState = doc.state
    const loadedState = loaded.state
    expect(docState.anchorStatus).toEqual(AnchorStatus.PENDING)
    expect(loadedState.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)
    delete docState.anchorStatus
    delete loadedState.anchorStatus
    expect(loadedState.log.length).toEqual(2)
    expect(JSON.stringify(loadedState)).toEqual(JSON.stringify(docState))
  })

  test('load updated and anchored doc', async () => {
    const doc = await ModelInstanceDocument.create(ceramic0, CONTENT0, METADATA)
    await doc.replace(CONTENT1)
    await anchorUpdate(ceramic0, doc)

    const loaded = await ModelInstanceDocument.load(ceramic1, doc.id)

    expect(loaded.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(loaded.state.log.length).toEqual(3)
    expect(JSON.stringify(loaded.state)).toEqual(JSON.stringify(doc.state))
  })
})
