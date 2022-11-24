import { jest } from '@jest/globals'
import { Ceramic } from '../ceramic.js'
import { AnchorStatus, IpfsApi, TestUtils } from '@ceramicnetwork/common'
import { createIPFS, swarmConnect } from '@ceramicnetwork/ipfs-daemon'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { InMemoryAnchorService } from '../anchor/memory/in-memory-anchor-service.js'
import { createCeramic as vanillaCreateCeramic } from './create-ceramic.js'

const SEED = '6e34b2e1a9624113d81ece8a8a22e6e97f0e145c25c1d4d2d0e62753b4060c83'

const createCeramic = async (ipfs: IpfsApi, anchorManual: boolean): Promise<Ceramic> => {
  return vanillaCreateCeramic(ipfs, {
    anchorOnRequest: !anchorManual,
    seed: SEED,
  })
}

describe('Ceramic anchoring', () => {
  jest.setTimeout(60000)
  let ipfs1: IpfsApi
  let ipfs2: IpfsApi
  let ipfs3: IpfsApi

  beforeAll(async () => {
    const instances = await Promise.all(Array.from({ length: 3 }).map(() => createIPFS()))
    ipfs1 = instances[0]
    ipfs2 = instances[1]
    ipfs3 = instances[2]
    await swarmConnect(ipfs1, ipfs2)
    await swarmConnect(ipfs2, ipfs3)
    await swarmConnect(ipfs1, ipfs3)
  })

  afterAll(async () => {
    await ipfs1.stop()
    await ipfs2.stop()
    await ipfs3.stop()
  })

  it('test all commits anchored', async () => {
    const [ceramic1, ceramic2] = await Promise.all([
      createCeramic(ipfs1, true),
      createCeramic(ipfs2, false),
    ])

    const stream1 = await TileDocument.create(ceramic1, { a: 1 })

    await stream1.update({ a: 2 })
    await stream1.update({ a: 3 })

    await TestUtils.anchorUpdate(ceramic1, stream1)

    expect(stream1.content).toEqual({ a: 3 })
    expect(stream1.state.log.length).toEqual(4)
    expect(stream1.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

    const stream2 = await ceramic2.loadStream(stream1.id)
    expect(stream1.content).toEqual(stream2.content)
    expect(stream1.state.log.length).toEqual(stream2.state.log.length)

    await ceramic1.close()
    await ceramic2.close()
  })

  it('test no commits anchored', async () => {
    const [ceramic1, ceramic2] = await Promise.all([
      createCeramic(ipfs1, true),
      createCeramic(ipfs2, false),
    ])

    const stream1 = await TileDocument.create(ceramic1, { a: 1 }, null, {
      anchor: false,
      publish: false,
    })
    await stream1.update({ a: 2 }, null, { anchor: false, publish: false })
    await stream1.update({ a: 3 }, null, { anchor: false, publish: false })

    expect(stream1.content).toEqual({ a: 3 })
    expect(stream1.state.log.length).toEqual(3)

    const stream2 = await ceramic2.loadStream(stream1.id)
    expect(stream1.content).toEqual(stream2.content)
    expect(stream1.state.log.length).toEqual(stream2.state.log.length)

    await ceramic1.close()
    await ceramic2.close()
  })

  it('test genesis anchored and others not', async () => {
    const [ceramic1, ceramic2] = await Promise.all([
      createCeramic(ipfs1, true),
      createCeramic(ipfs2, false),
    ])

    const stream1 = await TileDocument.create<any>(ceramic1, { a: 123, b: 4567 })
    await stream1.update({ a: 4567 }, null, { anchor: false, publish: false })
    await stream1.update({ b: 123 }, null, { anchor: false, publish: false })

    expect(stream1.state.log.length).toEqual(3)

    await TestUtils.anchorUpdate(ceramic1, stream1)

    expect(stream1.content).toEqual({ a: 123, b: 4567 })
    expect(stream1.state.log.length).toEqual(2)

    const stream2 = await ceramic2.loadStream(stream1.id)
    expect(stream1.content).toEqual(stream2.content)
    expect(stream1.state.log.length).toEqual(stream2.state.log.length)

    await ceramic1.close()
    await ceramic2.close()
  })

  it('test genesis and the following anchored', async () => {
    const [ceramic1, ceramic2] = await Promise.all([
      createCeramic(ipfs1, true),
      createCeramic(ipfs2, false),
    ])

    const stream1 = await TileDocument.create(ceramic1, { a: 123 })
    await stream1.update({ a: 4567 })

    expect(stream1.state.log.length).toEqual(2)

    await TestUtils.anchorUpdate(ceramic1, stream1)

    expect(stream1.content).toEqual({ a: 4567 })
    expect(stream1.state.log.length).toEqual(3)

    const stream2 = await ceramic2.loadStream(stream1.id)
    expect(stream1.content).toEqual(stream2.content)
    expect(stream1.state.log.length).toEqual(stream2.state.log.length)

    await ceramic1.close()
    await ceramic2.close()
  })

  it('test genesis anchored, the middle not, last one anchored', async () => {
    const [ceramic1, ceramic2] = await Promise.all([
      createCeramic(ipfs1, true),
      createCeramic(ipfs2, false),
    ])

    const stream1 = await TileDocument.create(ceramic1, { x: 1 })
    await stream1.update({ x: stream1.content.x + 1 }, null, { anchor: false, publish: false })
    await stream1.update({ x: stream1.content.x + 1 }, null, { anchor: true, publish: true })

    await TestUtils.anchorUpdate(ceramic1, stream1)

    expect(stream1.content).toEqual({ x: 3 })
    expect(stream1.state.log.length).toEqual(4)

    const stream2 = await ceramic2.loadStream(stream1.id)
    expect(stream1.content).toEqual(stream2.content)
    expect(stream1.state.log.length).toEqual(stream2.state.log.length)

    await ceramic1.close()
    await ceramic2.close()
  })

  it('test last one anchored', async () => {
    const [ceramic1, ceramic2] = await Promise.all([
      createCeramic(ipfs1, true),
      createCeramic(ipfs2, false),
    ])

    const stream1 = await TileDocument.create(ceramic1, { x: 1 }, null, {
      anchor: false,
      publish: false,
    })
    await stream1.update({ x: stream1.content.x + 1 }, null, { anchor: false, publish: false })
    await stream1.update({ x: stream1.content.x + 1 }, null, { anchor: true, publish: true })

    await TestUtils.anchorUpdate(ceramic1, stream1)

    expect(stream1.content).toEqual({ x: 3 })
    expect(stream1.state.log.length).toEqual(4)

    const stream2 = await ceramic2.loadStream(stream1.id)
    expect(stream1.content).toEqual(stream2.content)
    expect(stream1.state.log.length).toEqual(stream2.state.log.length)

    await ceramic1.close()
    await ceramic2.close()
  })

  it('in the middle anchored', async () => {
    const [ceramic1, ceramic2] = await Promise.all([
      createCeramic(ipfs1, true),
      createCeramic(ipfs2, false),
    ])

    const stream1 = await TileDocument.create(ceramic1, { x: 1 }, null, {
      anchor: false,
      publish: false,
    })
    await stream1.update({ x: stream1.content.x + 1 }, null, { anchor: false, publish: false })

    expect(stream1.content).toEqual({ x: 2 })
    expect(stream1.state.log.length).toEqual(2)

    await stream1.update({ x: stream1.content.x + 1 }, null, { anchor: true, publish: true })

    await TestUtils.anchorUpdate(ceramic1, stream1)

    expect(stream1.content).toEqual({ x: 3 })
    expect(stream1.state.log.length).toEqual(4)

    await stream1.update({ x: stream1.content.x + 1 }, null, { anchor: false, publish: false })
    await stream1.update({ x: stream1.content.x + 1 }, null, { anchor: false, publish: false })
    await stream1.update({ x: stream1.content.x + 1 }, null, { anchor: true, publish: true })

    await TestUtils.anchorUpdate(ceramic1, stream1)

    expect(stream1.content).toEqual({ x: 6 })
    expect(stream1.state.log.length).toEqual(8)

    const stream2 = await ceramic2.loadStream<TileDocument>(stream1.id)
    await TestUtils.waitForState(
      stream2,
      5000, // 5 second timeout
      (state) => state.content == stream1.content,
      () => expect(stream1.content).toEqual(stream2.content)
    )
    expect(stream1.state.log.length).toEqual(stream2.state.log.length)

    await ceramic1.close()
    await ceramic2.close()
  })

  it('test the same doc anchored twice (different Ceramic instances), first one wins)', async () => {
    const [ceramic1, ceramic2, ceramic3] = await Promise.all([
      createCeramic(ipfs1, true),
      createCeramic(ipfs2, true),
      createCeramic(ipfs3, true),
    ])

    const anchorService = ceramic3.context.anchorService as InMemoryAnchorService
    // use ceramic3 in-memory anchor service, ugly as hell
    ceramic1.repository.stateManager.anchorService = anchorService
    ceramic2.repository.stateManager.anchorService = anchorService

    const stream1 = await TileDocument.create(ceramic1, { x: 1 }, null, {
      anchor: false,
      publish: true,
    })
    stream1.subscribe()
    const stream2 = await TileDocument.load(ceramic2, stream1.id)
    stream2.subscribe()

    // Create two conflicting updates, each on a different ceramic instance
    const newContent1 = { x: 7 }
    const newContent2 = { x: 5 }
    await stream1.update(newContent1, null, { anchor: true, publish: false })
    await stream2.update(newContent2, null, { anchor: true, publish: false })

    // Which update wins depends on which update got assigned the lower CID
    const update1ShouldWin =
      stream1.state.log[stream1.state.log.length - 1].cid.bytes <
      stream2.state.log[stream2.state.log.length - 1].cid.bytes
    const winningContent = update1ShouldWin ? newContent1 : newContent2

    await anchorService.anchor()
    await TestUtils.waitForState(
      stream2,
      4000,
      (state) => state.anchorStatus === AnchorStatus.ANCHORED,
      () => {
        throw new Error(`stream2 not anchored still`)
      }
    )
    await TestUtils.waitForState(
      stream1,
      4000,
      (state) => state.anchorStatus === AnchorStatus.ANCHORED,
      () => {
        throw new Error(`stream1 not anchored still`)
      }
    )

    // Only one of the updates should have won
    expect(stream1.state.log.length).toEqual(3)
    expect(stream2.state.log.length).toEqual(3)
    expect(stream1.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(stream2.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(stream1.content).toEqual(winningContent)
    expect(stream2.content).toEqual(winningContent)

    const stream3 = await ceramic3.loadStream<TileDocument>(stream1.id)
    expect(stream3.content).toEqual(winningContent)
    expect(stream3.state.log.length).toEqual(3)

    await ceramic1.close()
    await ceramic2.close()
    await ceramic3.close()
  })

  it('loading stream works when anchor is invalid', async () => {
    const [ceramic1, ceramic2] = await Promise.all([
      createCeramic(ipfs1, true),
      createCeramic(ipfs2, false),
    ])

    const stream1 = await TileDocument.create(ceramic1, { x: 1 }, null, {
      anchor: false,
      publish: false,
    })
    await stream1.update({ x: stream1.content.x + 1 }, null, { anchor: false, publish: false })
    await stream1.update({ x: stream1.content.x + 1 }, null, { anchor: true, publish: true })

    await TestUtils.anchorUpdate(ceramic1, stream1)

    expect(stream1.content).toEqual({ x: 3 })
    expect(stream1.state.log.length).toEqual(4)

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const c2anchorValidator = ceramic2._anchorValidator
    const validateChainInclusionSpy = jest.spyOn(c2anchorValidator, 'validateChainInclusion')
    validateChainInclusionSpy.mockRejectedValue(new Error("blockNumbers don't match"))

    // Even though validating the anchor commit fails, the stream should still be loaded successfully
    // just with the anchor commit missing.
    const stream2 = await ceramic2.loadStream(stream1.id)
    expect(stream2.content).toEqual(stream1.content)
    expect(stream2.state.log.length).toEqual(stream1.state.log.length - 1)
    expect(stream2.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)

    await ceramic1.close()
    await ceramic2.close()
  })

  describe('Request anchor', () => {
    it('Can request missing anchor', async () => {
      const ceramic = await createCeramic(ipfs1, true)

      // create stream without requesting anchor
      const stream = await TileDocument.create(ceramic, { x: 1 }, null, { anchor: false })
      expect(stream.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)

      // request anchor
      const anchorStatus = await stream.requestAnchor()
      expect(anchorStatus).toEqual(AnchorStatus.PENDING)
      expect(stream.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)
      await stream.sync()
      expect(stream.state.anchorStatus).toEqual(AnchorStatus.PENDING)

      // fulfill anchor
      await TestUtils.anchorUpdate(ceramic, stream)
      expect(stream.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      await ceramic.close()
    })

    it('Can request new anchor after failed anchor', async () => {
      const ceramic = await createCeramic(ipfs1, true)

      // create stream without requesting anchor
      const stream = await TileDocument.create(ceramic, { x: 1 }, null, { anchor: true })
      expect(stream.state.anchorStatus).toEqual(AnchorStatus.PENDING)

      // fail anchor
      const anchorService = ceramic.context.anchorService as any as InMemoryAnchorService
      await anchorService.failPendingAnchors()
      await stream.sync()
      expect(stream.state.anchorStatus).toEqual(AnchorStatus.FAILED)
      expect(stream.state.log.length).toEqual(1)

      // re-request anchor, should be successful
      const anchorStatus = await stream.requestAnchor()
      expect(anchorStatus).toEqual(AnchorStatus.PENDING)
      await stream.sync()
      expect(stream.state.anchorStatus).toEqual(AnchorStatus.PENDING)

      // fulfill anchor
      await TestUtils.anchorUpdate(ceramic, stream)
      expect(stream.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
      expect(stream.state.log.length).toEqual(2)

      await ceramic.close()
    })

    it('Requesting anchor is noop for already anchored stream', async () => {
      const ceramic = await createCeramic(ipfs1, true)

      // create stream without requesting anchor
      const stream = await TileDocument.create(ceramic, { x: 1 }, null, { anchor: true })
      expect(stream.state.anchorStatus).toEqual(AnchorStatus.PENDING)

      // fulfill anchor
      await TestUtils.anchorUpdate(ceramic, stream)
      expect(stream.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
      expect(stream.state.log.length).toEqual(2)

      // request anchor, should be a no-op
      const anchorStatus = await stream.requestAnchor()
      expect(anchorStatus).toEqual(AnchorStatus.ANCHORED)
      await stream.sync()
      expect(stream.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
      expect(stream.state.log.length).toEqual(2)

      await ceramic.close()
    })
  })
})
