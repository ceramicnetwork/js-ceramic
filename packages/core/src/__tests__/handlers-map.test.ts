import { jest } from '@jest/globals'
import { HandlersMap } from '../handlers-map.js'
import { Stream, StreamHandler, LoggerProvider } from '@ceramicnetwork/common'
import { Caip10LinkHandler } from '@ceramicnetwork/stream-caip10-link-handler'
import { ModelHandler } from '@ceramicnetwork/stream-model-handler'
import { ModelInstanceDocumentHandler } from '@ceramicnetwork/stream-model-instance-handler'
import { TileDocumentHandler } from '@ceramicnetwork/stream-tile-handler'
import type { SchemaValidation } from 'ajv-threads'

const loggerProvider = new LoggerProvider()
const logger = loggerProvider.getDiagnosticsLogger()

describe('constructor', () => {
  test('default handlers', () => {
    const handlers = HandlersMap.makeWithDefaultHandlers(logger, null as SchemaValidation)
    expect(handlers.get('tile')).toBeInstanceOf(TileDocumentHandler)
    expect(handlers.get('caip10-link')).toBeInstanceOf(Caip10LinkHandler)
    expect(handlers.get('model')).toBeInstanceOf(ModelHandler)
    expect(handlers.get('MID')).toBeInstanceOf(ModelInstanceDocumentHandler)
  })
  test('custom handlers', () => {
    const customHandler = jest.fn() as unknown as StreamHandler<Stream>
    const handlers = HandlersMap.makeWithHandlers(logger, new Map().set(13, customHandler))
    expect(handlers.get(13)).toBe(customHandler)
  })
})

test('set and get', () => {
  const customHandler = { name: 'custom', type: 13 } as unknown as StreamHandler<Stream>
  const handlers = HandlersMap.makeEmpty(logger)
  expect(() => handlers.get('custom')).toThrow()
  handlers.add(customHandler)
  expect(() => handlers.get('custom')).toThrow()
  expect(handlers.get(13)).toBe(customHandler)
})

test('get non-existing', () => {
  const handlers = HandlersMap.makeEmpty(logger)
  expect(() => handlers.get('custom')).toThrow()
})
