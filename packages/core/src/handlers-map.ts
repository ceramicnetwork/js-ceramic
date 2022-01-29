import { TileDocumentHandler } from '@ceramicnetwork/stream-tile-handler'
import { Caip10LinkHandler } from '@ceramicnetwork/stream-caip10-link-handler'
import { Stream, StreamHandler } from '@ceramicnetwork/common'
import { DiagnosticsLogger } from '@ceramicnetwork/common'
import { StreamType } from '@ceramicnetwork/streamid'
import { DidPublishDocumentHandler } from './did-publish.js'

type Registry = Map<number, StreamHandler<Stream>>

function defaultHandlers(): Registry {
  const tile = new TileDocumentHandler()
  const caip10Link = new Caip10LinkHandler()
  const didPublish = new DidPublishDocumentHandler()
  const handlers = new Map<number, StreamHandler<Stream>>()
  handlers.set(tile.type, tile)
  handlers.set(caip10Link.type, caip10Link)
  handlers.set(didPublish.type, didPublish)
  return handlers
}

/**
 * Container for stream handlers. Maps stream code to the handler instance.
 */
export class HandlersMap {
  private readonly handlers: Registry

  constructor(private readonly logger: DiagnosticsLogger, handlers?: Registry) {
    this.handlers = handlers || defaultHandlers()
  }

  /**
   * Return stream handler based on its name or code. Throw error if not found.
   *
   * @param type - name or id of the handler.
   */
  get<T extends Stream>(type: string | number): StreamHandler<T> {
    const id = typeof type == 'string' ? StreamType.codeByName(type) : type
    const handler = this.handlers.get(id)
    if (handler) {
      return handler as StreamHandler<T>
    } else {
      throw new Error(type + ' is not a valid stream type')
    }
  }

  /**
   * Add stream handler to the collection.
   */
  add<T extends Stream>(streamHandler: StreamHandler<T>): HandlersMap {
    this.logger.debug(`Registered handler for ${streamHandler.type} stream type`)
    this.handlers.set(streamHandler.type, streamHandler)
    return this
  }
}
