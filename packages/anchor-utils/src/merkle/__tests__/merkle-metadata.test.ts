import { jest, describe, expect, test } from '@jest/globals'
import { IpfsLeafCompare } from '../ipfs-leaf-compare.js'
import type { ICandidate } from '../candidate.type.js'
import type { DiagnosticsLogger } from '@ceramicnetwork/common'
import type { Node } from '../merkle-elements.js'

const fauxLogger = {
  err: jest.fn(),
} as unknown as DiagnosticsLogger

describe('IpfsLeafCompare sorting', () => {
  const leaves = new IpfsLeafCompare(fauxLogger)

  const mockNode = (streamId: string, metadata: any): Node<ICandidate> => {
    return { data: { streamId, metadata, model: metadata.model } } as unknown as Node<ICandidate>
  }

  const node0 = mockNode('id0', { controllers: ['a'] })
  const node1 = mockNode('id1', {
    controllers: ['b'],
    model: 'model1',
  })
  const node2 = mockNode('id2', {
    controllers: ['a'],
    model: 'model2',
  })
  const node3 = mockNode('id3', {
    controllers: ['b'],
    model: 'model2',
  })
  const node4 = mockNode('id4', {
    controllers: ['b'],
    model: 'model2',
  })

  test('model ordering - single model', () => {
    // Pick node1 that contains a model
    expect(leaves.compare(node0, node1)).toBe(1)
  })

  test('model ordering - two models', () => {
    // Pick node1, sorted by model name
    expect(leaves.compare(node1, node2)).toBe(-1)
  })

  test('controller ordering', () => {
    // Same model, compare by controller, pick node2 sorted by controller name
    expect(leaves.compare(node2, node3)).toBe(-1)
  })

  test('streamID ordering', () => {
    // Same model and controller, pick node3 sorted by stream ID
    expect(leaves.compare(node3, node4)).toBe(-1)
  })
})
