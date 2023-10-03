import type { CeramicCoreApi } from '@ceramicnetwork/common'
import { jest } from '@jest/globals'

import { Model, loadInterfaceImplements, loadAllModelInterfaces } from '../model.js'

const MODEL_ID_1 = 'kjzl6hvfrbw6c5ykyyjq0v80od0nhdimprq7j2pccg1l100ktiiqcc01ddka001'
const MODEL_ID_2 = 'kjzl6hvfrbw6c5ykyyjq0v80od0nhdimprq7j2pccg1l100ktiiqcc01ddka002'
const MODEL_ID_3 = 'kjzl6hvfrbw6c5ykyyjq0v80od0nhdimprq7j2pccg1l100ktiiqcc01ddka003'
const MODEL_ID_4 = 'kjzl6hvfrbw6c5ykyyjq0v80od0nhdimprq7j2pccg1l100ktiiqcc01ddka004'
const MODEL_ID_5 = 'kjzl6hvfrbw6c5ykyyjq0v80od0nhdimprq7j2pccg1l100ktiiqcc01ddka005'

test('Model.MODEL', () => {
  expect(Model.MODEL.bytes).toMatchSnapshot()
  expect(Model.MODEL.toString()).toMatchSnapshot()
})

describe('loadInterfaceImplements()', () => {
  test('throws when loading a v1 model', async () => {
    const loadStream = jest.fn(() => ({ content: { version: '1.0' } }))
    const loader = { loadStream } as unknown as CeramicCoreApi
    await expect(loadInterfaceImplements(loader, MODEL_ID_1)).rejects.toThrow(
      `Model ${MODEL_ID_1} is not an interface`
    )
  })

  test('throws when loading a non-interface model', async () => {
    const loadStream = jest.fn(() => ({ content: { version: '2.0', interface: false } }))
    const loader = { loadStream } as unknown as CeramicCoreApi
    await expect(loadInterfaceImplements(loader, MODEL_ID_1)).rejects.toThrow(
      `Model ${MODEL_ID_1} is not an interface`
    )
  })

  test('returns the implemented interfaces', async () => {
    const expected = ['interface1', 'interface2']
    const loadStream = jest.fn(() => ({
      content: { version: '2.0', interface: true, implements: expected },
    }))
    const loader = { loadStream } as unknown as CeramicCoreApi
    await expect(loadInterfaceImplements(loader, MODEL_ID_1)).resolves.toEqual(expected)
  })
})

describe('loadAllModelInterfaces()', () => {
  test('throws if any model loading fails', async () => {
    const streams = {
      [MODEL_ID_1]: { version: '2.0', interface: true, implements: [] },
      [MODEL_ID_2]: { version: '1.0' },
    }
    const loadStream = jest.fn((id: string) => {
      const content = streams[id]
      if (content == null) {
        throw new Error(`Stream not found: ${id}`)
      }
      return { content }
    })
    const loader = { loadStream } as unknown as CeramicCoreApi

    await expect(loadAllModelInterfaces(loader, [MODEL_ID_1, MODEL_ID_2])).rejects.toThrow(
      `Model ${MODEL_ID_2} is not an interface`
    )
    expect(loadStream).toHaveBeenCalledTimes(2)
  })

  test('recursively loads all interfaces', async () => {
    const streamImplements = {
      [MODEL_ID_1]: [],
      [MODEL_ID_2]: [MODEL_ID_1],
      [MODEL_ID_3]: [MODEL_ID_2],
      [MODEL_ID_4]: [MODEL_ID_1, MODEL_ID_3],
      [MODEL_ID_5]: [MODEL_ID_1],
    }
    const loadStream = jest.fn((id: string) => {
      const found = streamImplements[id]
      if (found == null) {
        throw new Error(`Stream not found: ${id}`)
      }
      return { content: { version: '2.0', interface: true, implements: found } }
    })
    const loader = { loadStream } as unknown as CeramicCoreApi

    // Share loading state between multiple calls
    const loading = {}
    await expect(loadAllModelInterfaces(loader, [MODEL_ID_3], loading)).resolves.toEqual([
      MODEL_ID_3,
      MODEL_ID_2,
      MODEL_ID_1,
    ])
    expect(loadStream).toHaveBeenCalledTimes(3)

    await expect(
      loadAllModelInterfaces(loader, [MODEL_ID_4, MODEL_ID_5], loading)
    ).resolves.toEqual([MODEL_ID_4, MODEL_ID_5, MODEL_ID_1, MODEL_ID_3, MODEL_ID_2])
    // Only 2 extra stream loads using the shared loading state
    expect(loadStream).toHaveBeenCalledTimes(5)
  })
})
