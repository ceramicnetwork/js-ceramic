import { EventEmitter } from 'node:events'
import type { Block, Provider } from '@ethersproject/providers'
import { jest } from '@jest/globals'
import { firstValueFrom, from, of, toArray } from 'rxjs'

import {
  type BlockListenerEvent,
  createBlockListener,
  createContinuousBlocksListener,
  mapProcessBlock,
} from '../listener.js'

import { mockedLogs, getMockedLogsProofs } from './test-utils.js'

describe('listener', () => {
  test('createContinuousBlocksListener() pushes continous slices of block numbers', async () => {
    const provider = new EventEmitter() as unknown as Provider
    const blocksSlices$ = createContinuousBlocksListener(provider, 10)

    const slices = await new Promise((resolve) => {
      const slices: Array<Array<number>> = []
      const sub = blocksSlices$.subscribe({
        next: (blocks) => {
          slices.push(blocks)
        },
      })

      // 1 - single block pushed
      provider.emit('block', 105)
      // 2 - previous block, ignored
      provider.emit('block', 99)
      // 3 - future blocks, buffered
      provider.emit('block', 110)
      provider.emit('block', 107)
      // 4 - trigger push of continuous slice 96 to 100
      provider.emit('block', 106)
      // 5 - already pushed blocks, ignored
      provider.emit('block', 109)
      provider.emit('block', 108)
      // 6 - future block, buffered
      provider.emit('block', 113)
      // 7 - trigger push of continuous slice 101 to 103
      provider.emit('block', 111)
      // 8 - single block pushed
      provider.emit('block', 114)

      sub.unsubscribe()
      resolve(slices)
    })

    expect(slices).toEqual([
      [95], // 1
      // 2 filtered out
      [96, 97, 98, 99, 100], // 3-4
      // 5 filtered out
      [101, 102, 103], // 6-7
      [104], // 8
    ])
  })

  describe('mapProcessBlock() operator', () => {
    test('pushes reorganized event if block parent hash does not match provided previous hash', async () => {
      const getLogs = jest.fn(() => Promise.resolve(mockedLogs))
      const provider = { getLogs } as unknown as Provider
      const expectedParentHash = 'block0hash'
      const block = { parentHash: 'block1hash' } as Block

      const events$ = of(block).pipe(mapProcessBlock(provider, 'eip155:1337', expectedParentHash))
      const event = await firstValueFrom(events$)
      expect(event).toEqual({
        reorganized: true,
        block,
        proofs: getMockedLogsProofs(block),
        expectedParentHash,
      })
    })

    test('load logs and pushes processed block even if parent hash matches expected', async () => {
      const getLogs = jest.fn(() => Promise.resolve(mockedLogs))
      const provider = { getLogs } as unknown as Provider
      const expectedParentHash = 'block0hash'
      const block = { parentHash: expectedParentHash, number: 10, timestamp: 1000 } as Block

      const events$ = of(block).pipe(mapProcessBlock(provider, 'eip155:1337', expectedParentHash))
      const event = await firstValueFrom(events$)
      expect(event).toEqual({
        reorganized: false,
        block,
        proofs: getMockedLogsProofs(block),
      })
    })

    test('process multiple blocks with reorganization', async () => {
      const getLogs = jest.fn(() => Promise.resolve(mockedLogs))
      const provider = { getLogs } as unknown as Provider
      const blocks: Array<Block> = [
        { hash: 'block1', parentHash: 'block0', number: 1, timestamp: 100 } as Block,
        { hash: 'block2', parentHash: 'block1', number: 2, timestamp: 200 } as Block,
        // Reorganization on block 3
        { hash: 'block3', parentHash: 'block0', number: 3, timestamp: 300 } as Block,
        { hash: 'block4', parentHash: 'block3', number: 4, timestamp: 400 } as Block,
        { hash: 'block5', parentHash: 'block4', number: 5, timestamp: 500 } as Block,
      ]

      const events$ = from(blocks).pipe(mapProcessBlock(provider, 'eip155:1337'), toArray())
      const events = await firstValueFrom(events$)

      expect(events).toEqual([
        { reorganized: false, block: blocks[0], proofs: getMockedLogsProofs(blocks[0]) },
        { reorganized: false, block: blocks[1], proofs: getMockedLogsProofs(blocks[1]) },
        {
          reorganized: true,
          block: blocks[2],
          proofs: getMockedLogsProofs(blocks[2]),
          expectedParentHash: blocks[1].hash,
        },
        { reorganized: false, block: blocks[3], proofs: getMockedLogsProofs(blocks[3]) },
        { reorganized: false, block: blocks[4], proofs: getMockedLogsProofs(blocks[4]) },
      ])
    })
  })

  test('createBlockListener()', async () => {
    const blocks: Array<Block> = [
      { hash: 'block1', parentHash: 'block0', number: 1, timestamp: 100 } as Block,
      { hash: 'block2', parentHash: 'block1', number: 2, timestamp: 200 } as Block,
      // Reorganization on block 3
      { hash: 'block3', parentHash: 'block0', number: 3, timestamp: 300 } as Block,
      { hash: 'block4', parentHash: 'block3', number: 4, timestamp: 400 } as Block,
      { hash: 'block5', parentHash: 'block4', number: 5, timestamp: 500 } as Block,
    ]

    const provider = new EventEmitter() as unknown as Provider
    provider.getLogs = jest.fn(() => Promise.resolve(mockedLogs))
    provider.getBlock = jest.fn((blockNumber: number) => Promise.resolve(blocks[blockNumber - 1]))

    const events$ = createBlockListener({ chainId: 'eip155:1337', confirmations: 10, provider })

    const events = await new Promise((resolve) => {
      const events: Array<BlockListenerEvent> = []
      let i = 0
      const sub = events$.subscribe({
        next(event) {
          events.push(event)
          if (++i === blocks.length) {
            sub.unsubscribe()
            resolve(events)
          }
        },
      })

      // single block pushed
      provider.emit('block', 11)
      // previous block, ignored
      provider.emit('block', 5)
      // future blocks, buffered
      provider.emit('block', 14)
      provider.emit('block', 13)
      // trigger push of continuous slice 2 to 4
      provider.emit('block', 12)
      // single block pushed
      provider.emit('block', 15)
    })

    expect(events).toEqual([
      { reorganized: false, block: blocks[0], proofs: getMockedLogsProofs(blocks[0]) },
      { reorganized: false, block: blocks[1], proofs: getMockedLogsProofs(blocks[1]) },
      {
        reorganized: true,
        block: blocks[2],
        proofs: getMockedLogsProofs(blocks[2]),
        expectedParentHash: blocks[1].hash,
      },
      { reorganized: false, block: blocks[3], proofs: getMockedLogsProofs(blocks[3]) },
      { reorganized: false, block: blocks[4], proofs: getMockedLogsProofs(blocks[4]) },
    ])
  })
})
