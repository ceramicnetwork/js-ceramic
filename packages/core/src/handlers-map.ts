import { TileDocumentHandler } from '@ceramicnetwork/doctype-tile-handler';
import { Caip10LinkHandler } from '@ceramicnetwork/doctype-caip10-link-handler';
import { Stream, StreamHandler } from '@ceramicnetwork/common';
import { DiagnosticsLogger } from '@ceramicnetwork/common';
import { StreamType } from '@ceramicnetwork/streamid';

type Registry = Map<number, DoctypeHandler<Doctype>>

/**
 * Container for doctype handlers. Maps doctype name to the handler instance.
 * TODO: This should map from doctype id rather than doctype name.
 */
export class HandlersMap {
  private readonly handlers: Registry;

  constructor(private readonly logger: DiagnosticsLogger, handlers?: Registry) {
    this.handlers = handlers || this.defaultHandlers()
  }

  private defaultHandlers(): Registry {
    const tile = new TileDoctypeHandler()
    const caip10Link = new Caip10LinkDoctypeHandler()
    const handlers = new Map<number, DoctypeHandler<Doctype>>()
    handlers.set(tile.type, tile)
    handlers.set(caip10Link.type, caip10Link)
    return handlers
  }

  /**
   * Return doctype handler based on its name. Throw error if not found.
   *
   * @param type - name or id of the handler.
   */
  get<T extends Stream>(type: string | number): StreamHandler<T> {
    const id = typeof type == 'string' ? StreamType.indexByName(type) : type
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
