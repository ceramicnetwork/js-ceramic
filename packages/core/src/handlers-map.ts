import { TileDocumentHandler } from '@ceramicnetwork/doctype-tile-handler';
import { Caip10LinkHandler } from '@ceramicnetwork/doctype-caip10-link-handler';
import { Stream, StreamHandler } from '@ceramicnetwork/common';
import { DiagnosticsLogger } from '@ceramicnetwork/common';

/**
 * Container for doctype handlers. Maps doctype name to the handler instance.
 * TODO: This should map from doctype id rather than doctype name.
 */
export class HandlersMap {
  private readonly handlers: Map<string, StreamHandler<Stream>>;

  constructor(private readonly logger: DiagnosticsLogger, handlers?: Map<string, StreamHandler<Stream>>) {
    this.handlers =
      handlers || new Map().set('tile', new TileDocumentHandler()).set('caip10-link', new Caip10LinkHandler());
  }

  /**
   * Return doctype handler based on its name. Throw error if not found.
   *
   * @param doctypeName - name of the handler.
   */
  get<T extends Stream>(doctypeName: string): StreamHandler<T> {
    const handler = this.handlers.get(doctypeName);
    if (handler) {
      return handler as StreamHandler<T>;
    } else {
      throw new Error(doctypeName + ' is not a valid doctype');
    }
  }

  /**
   * Add doctype handler to the collection.
   */
  add<T extends Stream>(doctypeHandler: StreamHandler<T>): HandlersMap {
    this.logger.debug(`Registered handler for ${doctypeHandler.name} doctype`);
    this.handlers.set(doctypeHandler.name, doctypeHandler);
    return this;
  }
}
