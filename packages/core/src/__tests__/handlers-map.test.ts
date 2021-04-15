import { HandlersMap } from '../handlers-map';
import { Stream, StreamHandler, LoggerProvider } from '@ceramicnetwork/common';
import { TileDocumentHandler } from '@ceramicnetwork/doctype-tile-handler';
import { Caip10LinkHandler } from '@ceramicnetwork/doctype-caip10-link-handler';

const loggerProvider = new LoggerProvider();
const logger = loggerProvider.getDiagnosticsLogger();

describe('constructor', () => {
  test('default handlers', () => {
    const handlers = new HandlersMap(logger);
    expect(handlers.get('tile')).toBeInstanceOf(TileDocumentHandler);
    expect(handlers.get('caip10-link')).toBeInstanceOf(Caip10LinkHandler);
  });
  test('custom handlers', () => {
    const customHandler = (jest.fn() as unknown) as StreamHandler<Stream>;
    const handlers = new HandlersMap(logger, new Map().set('custom', customHandler));
    expect(handlers.get('custom')).toBe(customHandler);
  });
});

test('set and get', () => {
  const customHandler = ({ name: 'custom' } as unknown) as StreamHandler<Stream>;
  const handlers = new HandlersMap(logger);
  expect(() => handlers.get('custom')).toThrow();
  handlers.add(customHandler);
  expect(handlers.get('custom')).toBe(customHandler);
});

test('get non-existing', () => {
  const handlers = new HandlersMap(logger);
  expect(() => handlers.get('custom')).toThrow();
});
