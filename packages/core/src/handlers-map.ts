import { TileDocumentHandler } from '@ceramicnetwork/doctype-tile-handler';
import { Caip10LinkHandler } from '@ceramicnetwork/doctype-caip10-link-handler';
import { Stream, StreamHandler } from '@ceramicnetwork/common';
import { DiagnosticsLogger } from '@ceramicnetwork/common';
import { StreamType } from '@ceramicnetwork/streamid';

type Registry = Map<number, StreamHandler<Stream>>

function defaultHandlers(): Registry {
  const tile = new TileDocumentHandler()
  const caip10Link = new Caip10LinkHandler()
  const handlers = new Map<number, StreamHandler<Stream>>()
  handlers.set(tile.type, tile)
  handlers.set(caip10Link.type, caip10Link)
  return handlers
}

/**
 * Container for doctype handlers. Maps doctype name to the handler instance.
 */
export class HandlersMap {
  private readonly handlers: Registry;

  constructor(private readonly logger: DiagnosticsLogger, handlers?: Registry) {
    this.handlers = handlers || defaultHandlers()
  }

  /**
   * Return doctype handler based on its name. Throw error if not found.
   *
   * @param type - name or id of the handler.
   */
  get<T extends Stream>(type: string | number): StreamHandler<T> {
    const id = typeof type == 'string' ? StreamType.codeByName(type) : type
    const handler = this.handlers.get(id);
    if (handler) {
      return handler as StreamHandler<T>;
    } else {
      throw new Error(type + ' is not a valid doctype');
    }
  }

  /**
   * Add doctype handler to the collection.
   */
  add<T extends Stream>(doctypeHandler: StreamHandler<T>): HandlersMap {
    this.logger.debug(`Registered handler for ${doctypeHandler.type} doctype`);
    this.handlers.set(doctypeHandler.type, doctypeHandler);
    return this;
  }
}
