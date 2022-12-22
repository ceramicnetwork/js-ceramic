import type { Block, Provider } from '@ethersproject/providers'
import { jest } from '@jest/globals'
import { firstValueFrom, from, of, toArray } from 'rxjs'

import {
  createAncestorBlocksProofsLoader,
  createAnchorProofsLoader,
  createBlockLoader,
  createBlocksProofsLoader,
  loadAnchorProofs,
  loadBlock,
  mapLoadBlockProofs,
  mapLoadBlocks,
} from '../loader.js'
import { createAnchorProof } from '../utils.js'

import { createLog, delay, mockedLogs, getMockedLogsProofs } from './test-utils.js'

describe('loader', () => {
  describe('createBlockLoader()', () => {
    test('loads the block from the provider', async () => {
      const expectedBlock = {} as Block
      const getBlock = jest.fn(() => Promise.resolve(expectedBlock))
      const provider = { getBlock } as unknown as Provider
      const blockLoader = createBlockLoader(provider, 'foo')

      await expect(firstValueFrom(blockLoader)).resolves.toBe(expectedBlock)
      expect(getBlock).toHaveBeenCalledWith('foo')
    })

    test('retries loading based on the retry config argument', async () => {
      const expectedError = new Error('Failed to load')
      const getBlock = jest.fn(() => Promise.reject(expectedError))
      const provider = { getBlock } as unknown as Provider
      const blockLoader = createBlockLoader(provider, 'foo', { count: 2 })

      await expect(firstValueFrom(blockLoader)).rejects.toThrowError(expectedError)
      expect(getBlock).toHaveBeenCalledTimes(3)
    })

    test('retries loading based on the default retry count if not set', async () => {
      const expectedError = new Error('Failed to load')
      const getBlock = jest.fn(() => Promise.reject(expectedError))
      const provider = { getBlock } as unknown as Provider
      const blockLoader = createBlockLoader(provider, 'foo')

      await expect(firstValueFrom(blockLoader)).rejects.toThrowError(expectedError)
      expect(getBlock).toHaveBeenCalledTimes(4)
    })
  })

  test('loadBlock() returns the promise of a block', async () => {
    const expectedBlock = {} as Block
    const getBlock = jest.fn(() => Promise.resolve(expectedBlock))
    const provider = { getBlock } as unknown as Provider

    await expect(loadBlock(provider, 'foo')).resolves.toBe(expectedBlock)
    expect(getBlock).toHaveBeenCalledWith('foo')
  })

  test('mapLoadBlocks() operator pushes loaded blocks in input order', async () => {
    const blockNumbers = [100, 101, 102]
    const loadedOrder: Array<number> = []
    const getBlock = jest.fn(async (number: number) => {
      // Blocks will be resolved with delay so they are received out of order
      let wait = 0
      if (number === 100) {
        wait = 200
      } else if (number === 101) {
        wait = 50
      } else if (number === 102) {
        wait = 100
      }
      await delay(wait)
      loadedOrder.push(number)
      return { number } as Block
    })
    const provider = { getBlock } as unknown as Provider

    const loadedBlocks$ = of(blockNumbers).pipe(mapLoadBlocks(provider), toArray())
    // Blocks should get pushed in input order...
    await expect(firstValueFrom(loadedBlocks$)).resolves.toEqual([
      { number: 100 },
      { number: 101 },
      { number: 102 },
    ])
    // ... even if they got received out of order when loaded in parallel
    expect(loadedOrder).toEqual([101, 102, 100])
  })

  describe('createAnchorProofsLoader()', () => {
    test('Pushes an error if there is no contract address for the wanted chainId', async () => {
      // @ts-expect-error invalid chainId
      const anchorProofs$ = createAnchorProofsLoader({} as Provider, 'eip155:0', {} as Block)
      await expect(firstValueFrom(anchorProofs$)).rejects.toThrowError(
        'No known contract address for network: eip155:0'
      )
    })

    test('Pushes an array of anchor proofs', async () => {
      const logs = [0, 1, 2].map((i) => createLog(new Uint8Array(new Array(32).fill(i))))
      const getLogs = jest.fn(() => Promise.resolve(logs))
      const provider = { getLogs } as unknown as Provider
      const block = { number: 10, timestamp: 1000 } as Block

      const anchorProofs$ = createAnchorProofsLoader(provider, 'eip155:1337', block)
      await expect(firstValueFrom(anchorProofs$)).resolves.toEqual([
        createAnchorProof('eip155:1337', block, logs[0]),
        createAnchorProof('eip155:1337', block, logs[1]),
        createAnchorProof('eip155:1337', block, logs[2]),
      ])
    })
  })

  describe('loadAnchorProofs()', () => {
    test('Pushes an error if there is no contract address for the wanted chainId', async () => {
      // @ts-expect-error invalid chainId
      await expect(loadAnchorProofs({} as Provider, 'eip155:0', {} as Block)).rejects.toThrowError(
        'No known contract address for network: eip155:0'
      )
    })

    test('Pushes an array of anchor proofs', async () => {
      const getLogs = jest.fn(() => Promise.resolve(mockedLogs))
      const provider = { getLogs } as unknown as Provider
      const block = { number: 10, timestamp: 1000 } as Block

      await expect(loadAnchorProofs(provider, 'eip155:1337', block)).resolves.toEqual(
        getMockedLogsProofs(block)
      )
    })
  })

  test('mapLoadBlockProofs() operator loads the proofs', async () => {
    const getLogs = jest.fn(() => Promise.resolve(mockedLogs))
    const provider = { getLogs } as unknown as Provider
    const blocks = [
      { number: 10, timestamp: 1000 },
      { number: 11, timestamp: 1100 },
    ] as Array<Block>

    const blocksWithProofs$ = from(blocks).pipe(
      mapLoadBlockProofs(provider, 'eip155:1337'),
      toArray()
    )
    await expect(firstValueFrom(blocksWithProofs$)).resolves.toEqual([
      { block: blocks[0], proofs: getMockedLogsProofs(blocks[0]) },
      { block: blocks[1], proofs: getMockedLogsProofs(blocks[1]) },
    ])
  })

  test('createBlocksProofsLoader() loads the proofs', async () => {
    const blocks = [
      { number: 100, timestamp: 1000 },
      { number: 101, timestamp: 1100 },
      { number: 102, timestamp: 1200 },
    ] as Array<Block>
    const getBlock = jest.fn((blockNumber: number) => Promise.resolve(blocks[blockNumber - 100]))
    const getLogs = jest.fn(() => Promise.resolve(mockedLogs))
    const provider = { getBlock, getLogs } as unknown as Provider

    const blocksWithProofs$ = createBlocksProofsLoader({
      provider,
      chainId: 'eip155:1337',
      fromBlock: 100,
      toBlock: 102,
    })
    await expect(firstValueFrom(blocksWithProofs$.pipe(toArray()))).resolves.toEqual([
      { block: blocks[0], proofs: getMockedLogsProofs(blocks[0]) },
      { block: blocks[1], proofs: getMockedLogsProofs(blocks[1]) },
      { block: blocks[2], proofs: getMockedLogsProofs(blocks[2]) },
    ])
  })

  test('createAncestorBlocksProofsLoader() loads the proofs', async () => {
    const blocks: Record<string, Block> = {
      block0: { number: 100, timestamp: 1000 } as Block,
      block1: { parentHash: 'block0', number: 101, timestamp: 1100 } as Block,
      block2: { parentHash: 'block1', number: 102, timestamp: 1200 } as Block,
      latest: { parentHash: 'block2', number: 103, timestamp: 1300 } as Block,
    }
    const getBlock = jest.fn((blockTag: string) => Promise.resolve(blocks[blockTag]))
    const getLogs = jest.fn(() => Promise.resolve(mockedLogs))
    const provider = { getBlock, getLogs } as unknown as Provider

    const blocksWithProofs$ = createAncestorBlocksProofsLoader({
      provider,
      chainId: 'eip155:1337',
      initialBlock: 'latest',
      targetAncestorHash: 'block0',
    })
    await expect(firstValueFrom(blocksWithProofs$.pipe(toArray()))).resolves.toEqual([
      { block: blocks.latest, proofs: getMockedLogsProofs(blocks.latest) },
      { block: blocks.block2, proofs: getMockedLogsProofs(blocks.block2) },
      { block: blocks.block1, proofs: getMockedLogsProofs(blocks.block1) },
    ])
  })
})
