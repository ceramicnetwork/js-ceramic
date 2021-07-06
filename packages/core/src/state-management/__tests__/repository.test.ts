import { StreamUtils, IpfsApi } from '@ceramicnetwork/common'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import Ceramic from '../../ceramic'
import { createIPFS } from '../../__tests__/ipfs-util'
import { Repository } from '../repository'
import { anchorUpdate } from './anchor-update'
import { createCeramic } from '../../__tests__/create-ceramic'
import { delay } from '../../pubsub/__tests__/delay'

let ipfs: IpfsApi
let ceramic: Ceramic

let repository: Repository
let controllers: string[]

beforeAll(async () => {
  ipfs = await createIPFS()
  ceramic = await createCeramic(ipfs)

  repository = ceramic.repository
  controllers = [ceramic.did.id]
})

afterAll(async () => {
  await ceramic.close()
  await ipfs.stop()
})

const STRING_MAP_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'StringMap',
  type: 'object',
  additionalProperties: {
    type: 'string',
  },
}

describe('load', () => {
  test('from memory', async () => {
    const stream1 = await TileDocument.create(ceramic, { foo: 'bar' })
    const fromMemorySpy = jest.spyOn(repository, 'fromMemory')
    const fromStateStoreSpy = jest.spyOn(repository, 'fromStateStore')
    const fromNetwork = jest.spyOn(repository, 'fromNetwork')
    const stream2 = await repository.load(stream1.id, { syncTimeoutSeconds: 0 })
    expect(StreamUtils.serializeState(stream1.state)).toEqual(
      StreamUtils.serializeState(stream2.state)
    )
    expect(fromMemorySpy).toBeCalledTimes(1)
    expect(fromStateStoreSpy).toBeCalledTimes(0)
    expect(fromNetwork).toBeCalledTimes(0)
  })

  test('from state store', async () => {
    const fromMemorySpy = jest.spyOn(repository, 'fromMemory')
    const fromStateStoreSpy = jest.spyOn(repository, 'fromStateStore')
    const fromNetworkSpy = jest.spyOn(repository, 'fromNetwork')
    const syncSpy = jest.spyOn(repository.stateManager, 'sync')

    const stream1 = await TileDocument.create(ceramic, { foo: 'bar' }, null, { anchor: false })
    await ceramic.pin.add(stream1.id)

    fromMemorySpy.mockClear()
    fromStateStoreSpy.mockClear()
    fromNetworkSpy.mockClear()
    syncSpy.mockClear()
    fromMemorySpy.mockReturnValueOnce(null)
    fromMemorySpy.mockReturnValueOnce(null)

    const stream2 = await repository.load(stream1.id, { syncTimeoutSeconds: 0 })
    expect(StreamUtils.serializeState(stream2.state)).toEqual(
      StreamUtils.serializeState(stream1.state)
    )
    expect(fromMemorySpy).toBeCalledTimes(1)
    expect(fromStateStoreSpy).toBeCalledTimes(1)
    expect(fromNetworkSpy).toBeCalledTimes(0)
    // First time loading from state store it needs to be synced
    expect(syncSpy).toBeCalledTimes(1)

    const stream3 = await repository.load(stream1.id, { syncTimeoutSeconds: 0 })
    expect(StreamUtils.serializeState(stream3.state)).toEqual(
      StreamUtils.serializeState(stream1.state)
    )
    expect(fromMemorySpy).toBeCalledTimes(2)
    expect(fromStateStoreSpy).toBeCalledTimes(2)
    expect(fromNetworkSpy).toBeCalledTimes(0)
    // Second time loading from state store it does not need to be synced again
    expect(syncSpy).toBeCalledTimes(1)
  })
})

describe('validation', () => {
  test('when loading genesis ', async () => {
    // Create schema
    const schema = await TileDocument.create(ceramic, STRING_MAP_SCHEMA)
    await anchorUpdate(ceramic, schema)
    // Create invalid stream
    const ipfs2 = await createIPFS()
    const permissiveCeramic = await createCeramic(ipfs2, { validateStreams: false })
    const invalidDoc = await TileDocument.create(
      permissiveCeramic,
      { stuff: 1 },
      { schema: schema.commitId }
    )
    // Load it: Expect failure
    await expect(repository.load(invalidDoc.id, { syncTimeoutSeconds: 0 })).rejects.toThrow(
      'Validation Error: data/stuff must be string'
    )
    await permissiveCeramic.close()
    await ipfs2.stop()
  }, 20000)
})

test('subscribe makes state endured', async () => {
  const durableStart = ceramic.repository.inmemory.durable.size
  const volatileStart = ceramic.repository.inmemory.volatile.size
  const stream1 = await TileDocument.create(ceramic, { foo: 'bar' })
  expect(ceramic.repository.inmemory.durable.size).toEqual(durableStart)
  expect(ceramic.repository.inmemory.volatile.size).toEqual(volatileStart + 1)
  stream1.subscribe()
  await delay(200) // Wait for rxjs plumbing
  expect(ceramic.repository.inmemory.durable.size).toEqual(durableStart + 1)
  expect(ceramic.repository.inmemory.volatile.size).toEqual(volatileStart)
})
