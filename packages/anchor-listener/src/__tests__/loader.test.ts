import type { Block, Provider, Log, BlockTag } from '@ethersproject/providers'
import { jest } from '@jest/globals'
import { firstValueFrom, from, of, toArray } from 'rxjs'

import {
  createBlockLoader,
  loadBlock,
  mapLoadBlockForBlockProofs,
  createBlockProofsLoaderForRange,
  createAncestorBlocksProofsLoader,
  createBlocksProofsLoader,
  loadBlockProofsForRange,
  mapLoadBlockProofs,
  mapLoadBlockProofsForRange,
  type BlockProofs,
  BlockRangeFilter,
} from '../loader.js'
import { createAnchorProof } from '../utils.js'

import { createLog, delay, mockedLogs, mockedBlockProofs } from './test-utils.js'

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

  test('mapLoadBlockForBlockProofs() operator adds loaded blocks to block proofs in input order', async () => {
    const blockProofs = [
      { blockHash: '100' },
      { blockHash: '101' },
      { blockHash: '102' },
    ] as Array<BlockProofs>
    const loadedOrder: Array<string> = []
    const getBlock = jest.fn(async (hash: string) => {
      // Blocks will be resolved with delay so they are received out of order
      let wait = 0
      if (hash === '100') {
        wait = 200
      } else if (hash === '101') {
        wait = 50
      } else if (hash === '102') {
        wait = 100
      }
      await delay(wait)
      loadedOrder.push(hash)
      return { hash } as Block
    })
    const provider = { getBlock } as unknown as Provider

    const loadedBlocks$ = of(blockProofs).pipe(mapLoadBlockForBlockProofs(provider), toArray())
    // Blocks should get pushed in input order...
    await expect(firstValueFrom(loadedBlocks$)).resolves.toEqual(
      blockProofs.map((proofs) => ({ proofs, block: { hash: proofs.blockHash } }))
    )
    // ... even if they got received out of order when loaded in parallel
    expect(loadedOrder).toEqual(['101', '102', '100'])
  })

  describe('createBlockProofsLoaderForRange()', () => {
    test('Pushes an array of block proofs', async () => {
      const logs = [10, 11, 12].map((blockNumber) =>
        createLog(blockNumber, new Uint8Array(new Array(32).fill(blockNumber)))
      )
      const getLogs = jest.fn(() => Promise.resolve(logs))
      const getBlock = jest.fn((blockNumber: number) => {
        return {
          number: blockNumber,
          hash: blockNumber.toString(),
        } as Block
      })
      const provider = { getLogs, getBlock } as unknown as Provider

      const blockProofs$ = createBlockProofsLoaderForRange(provider, 'eip155:1337', {
        fromBlock: 10,
        toBlock: 12,
      })
      await expect(firstValueFrom(blockProofs$)).resolves.toEqual(
        [10, 11, 12].map((blockNumber, i) => ({
          blockHash: blockNumber.toString(),
          blockNumber,
          proofs: [createAnchorProof('eip155:1337', logs[i])],
        }))
      )
    })

    test('If no logs found pushes 2 block proofs if from block is different from to block', async () => {
      const getLogs = jest.fn(() => Promise.resolve([]))
      const getBlock = jest.fn((blockNumber: number) => {
        return {
          number: blockNumber,
          hash: blockNumber.toString(),
        } as Block
      })
      const provider = { getLogs, getBlock } as unknown as Provider

      const blockProofs$ = createBlockProofsLoaderForRange(provider, 'eip155:1337', {
        fromBlock: 10,
        toBlock: 12,
      })
      await expect(firstValueFrom(blockProofs$)).resolves.toEqual(
        [10, 12].map((blockNumber) => ({
          blockHash: blockNumber.toString(),
          blockNumber,
          proofs: [],
        }))
      )
    })
    test('If no logs found pushes 1 block proofs if the from block and to block are the same', async () => {
      const getLogs = jest.fn(() => Promise.resolve([]))
      const getBlock = jest.fn((blockNumber: number) => {
        return {
          number: blockNumber,
          hash: blockNumber.toString(),
        } as Block
      })
      const provider = { getLogs, getBlock } as unknown as Provider

      const blockProofs$ = createBlockProofsLoaderForRange(provider, 'eip155:1337', {
        fromBlock: 10,
        toBlock: 10,
      })
      await expect(firstValueFrom(blockProofs$)).resolves.toEqual([
        {
          blockHash: '10',
          blockNumber: 10,
          proofs: [],
        },
      ])
    })
  })

  describe('loadBlockProofsForRange()', () => {
    test('Pushes an array of block proofs', async () => {
      const getLogs = jest.fn(() => Promise.resolve(mockedLogs))
      const getBlock = jest.fn((blockNumber: number) => {
        return {
          number: blockNumber,
          hash: blockNumber.toString(),
        } as Block
      })
      const provider = { getLogs, getBlock } as unknown as Provider
      await expect(
        loadBlockProofsForRange(provider, 'eip155:1337', { fromBlock: 0, toBlock: 2 })
      ).resolves.toEqual(mockedBlockProofs)
    })
  })

  test('mapLoadBlockProofs() operator loads the proofs', async () => {
    const getLogs = jest.fn(({ fromBlock, toBlock }) => {
      expect(fromBlock).toEqual(toBlock)
      return Promise.resolve([mockedLogs[fromBlock]])
    })
    const getBlock = jest.fn((blockNumber: number) => {
      return {
        number: blockNumber,
        hash: blockNumber.toString(),
      } as Block
    })
    const provider = { getLogs, getBlock } as unknown as Provider
    const blocks = [
      { number: 0, timestamp: 1000 },
      { number: 1, timestamp: 1100 },
      { number: 2, timestamp: 1200 },
    ] as Array<Block>

    const blockProofs$ = from(blocks).pipe(mapLoadBlockProofs(provider, 'eip155:1337'), toArray())

    await expect(firstValueFrom(blockProofs$)).resolves.toEqual(mockedBlockProofs)
  })

  test('mapLoadBlockProofsForRange() operator loads the proofs for a given range', async () => {
    const logsByBlockNumber = {
      10: [
        createLog(10, new Uint8Array(new Array(32).fill(10))),
        createLog(10, new Uint8Array(new Array(32).fill(20))),
      ],
      11: [createLog(11, new Uint8Array(new Array(32).fill(11)))],
      12: [createLog(12, new Uint8Array(new Array(32).fill(12)))],
    }

    const getLogs = jest.fn(async ({ fromBlock, toBlock }) => {
      const logs: Array<Log> = []
      for (let i = fromBlock; i <= toBlock; i++) {
        logs.push(...logsByBlockNumber[i])
      }
      if (fromBlock === 10) {
        await delay(1000)
      }
      return logs
    })
    const getBlock = jest.fn((blockNumber: number) => {
      return {
        number: blockNumber,
        hash: blockNumber.toString(),
      } as Block
    })

    const provider = { getLogs, getBlock } as unknown as Provider
    const blockRanges = [
      { fromBlock: 10, toBlock: 11 },
      { fromBlock: 12, toBlock: 12 },
    ] as Array<BlockRangeFilter>

    const blockProofs$ = from(blockRanges).pipe(
      mapLoadBlockProofsForRange(provider, 'eip155:1337'),
      toArray()
    )

    await expect(firstValueFrom(blockProofs$)).resolves.toEqual([
      [
        {
          blockNumber: 10,
          blockHash: '10',
          proofs: logsByBlockNumber[10].map((log) => createAnchorProof('eip155:1337', log)),
        },
        {
          blockNumber: 11,
          blockHash: '11',
          proofs: logsByBlockNumber[11].map((log) => createAnchorProof('eip155:1337', log)),
        },
      ],
      [
        {
          blockNumber: 12,
          blockHash: '12',
          proofs: logsByBlockNumber[12].map((log) => createAnchorProof('eip155:1337', log)),
        },
      ],
    ])
  })

  test('createBlocksProofsLoader() loads the proofs', async () => {
    const getLogs = jest.fn(() => Promise.resolve(mockedLogs))
    const getBlock = jest.fn((blockNumber: number) => {
      return {
        number: blockNumber,
        hash: blockNumber.toString(),
      } as Block
    })
    const provider = { getLogs, getBlock } as unknown as Provider

    const blockProofs$ = createBlocksProofsLoader({
      provider,
      chainId: 'eip155:1337',
      fromBlock: 0,
      toBlock: 2,
    })
    await expect(firstValueFrom(blockProofs$.pipe(toArray()))).resolves.toEqual(mockedBlockProofs)
  })

  test('createAncestorBlocksProofsLoader() loads the proofs', async () => {
    const blocks: Record<string, Block> = {
      block0: { number: 100, timestamp: 1000 } as Block,
      block1: { parentHash: 'block0', number: 101, hash: '101', timestamp: 1100 } as Block,
      block2: { parentHash: 'block1', number: 102, hash: '102', timestamp: 1200 } as Block,
      latest: { parentHash: 'block2', number: 103, hash: '103', timestamp: 1300 } as Block,
    }

    const mockedLogs = [100, 101, 102, 103].map((i) =>
      createLog(i, new Uint8Array(new Array(32).fill(i)))
    ) as [Log, Log, Log]

    const getBlock = jest.fn((blockTag: BlockTag) => {
      if (typeof blockTag === 'number') {
        return Promise.resolve(blocks[blockTag === 103 ? 'latest' : `block${blockTag - 100}`])
      }

      return Promise.resolve(blocks[blockTag])
    })
    const getLogs = jest.fn(({ fromBlock }) => Promise.resolve([mockedLogs[fromBlock - 100]]))
    const provider = { getBlock, getLogs } as unknown as Provider

    const blocksWithProofs$ = createAncestorBlocksProofsLoader({
      provider,
      chainId: 'eip155:1337',
      initialBlock: 'latest',
      targetAncestorHash: 'block0',
    })

    await expect(firstValueFrom(blocksWithProofs$.pipe(toArray()))).resolves.toEqual(
      mockedLogs
        .slice(1)
        .reverse()
        .map((log) => ({
          blockNumber: log.blockNumber,
          blockHash: log.blockHash,
          proofs: [createAnchorProof('eip155:1337', log)],
        }))
    )
  })
})
