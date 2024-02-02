import { TileDocumentHandler } from '@ceramicnetwork/stream-tile-handler'
import { Caip10LinkHandler } from '@ceramicnetwork/stream-caip10-link-handler'
import { ModelHandler } from '@ceramicnetwork/stream-model-handler'
import { ModelInstanceDocumentHandler } from '@ceramicnetwork/stream-model-instance-handler'
import { Stream, StreamHandler } from '@ceramicnetwork/common'
import { DiagnosticsLogger } from '@ceramicnetwork/common'
import { StreamType } from '@ceramicnetwork/streamid'

export type Registry = Map<number, StreamHandler<Stream>>

export async function defaultHandlers(): Promise<Registry> {
  const tile = new TileDocumentHandler()
  await tile.init()
  const caip10Link = new Caip10LinkHandler()
  await caip10Link.init()
  const model = new ModelHandler()
  await model.init()
  const instance = new ModelInstanceDocumentHandler()
  await instance.init()
  const handlers = new Map<number, StreamHandler<Stream>>()
  handlers.set(tile.type, tile)
  handlers.set(caip10Link.type, caip10Link)
  handlers.set(model.type, model)
  handlers.set(instance.type, instance)
  return handlers
}

/**
 * Container for stream handlers. Maps stream code to the handler instance.
 */
export class HandlersMap {
  private readonly handlers: Registry

  constructor(private readonly logger: DiagnosticsLogger, handlers: Registry) {
    this.handlers = handlers
  }

  async shutdown(): Promise<void> {
    await Promise.all(Array.from(this.handlers.values()).map((handler) => handler.shutdown()))
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
