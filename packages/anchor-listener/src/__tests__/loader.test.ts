import type { Block, Provider } from '@ethersproject/providers'
import { jest } from '@jest/globals'
import { firstValueFrom, of, toArray } from 'rxjs'

import {
  createAnchorProofsLoader,
  createBlockLoader,
  loadBlock,
  loadBlockAnchorProofs,
  mapLoadBlocks,
} from '../loader.js'
import { createAnchorProof } from '../utils.js'

import { createLog, delay } from './test-utils.js'

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

  describe('loadBlockAnchorProofs()', () => {
    test('Pushes an error if there is no contract address for the wanted chainId', async () => {
      await expect(
        // @ts-expect-error invalid chainId
        loadBlockAnchorProofs({} as Provider, 'eip155:0', {} as Block)
      ).rejects.toThrowError('No known contract address for network: eip155:0')
    })

    test('Pushes an array of anchor proofs', async () => {
      const logs = [0, 1, 2].map((i) => createLog(new Uint8Array(new Array(32).fill(i))))
      const getLogs = jest.fn(() => Promise.resolve(logs))
      const provider = { getLogs } as unknown as Provider
      const block = { number: 10, timestamp: 1000 } as Block

      await expect(loadBlockAnchorProofs(provider, 'eip155:1337', block)).resolves.toEqual([
        createAnchorProof('eip155:1337', block, logs[0]),
        createAnchorProof('eip155:1337', block, logs[1]),
        createAnchorProof('eip155:1337', block, logs[2]),
      ])
    })
  })
})
