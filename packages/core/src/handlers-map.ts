import { TileDoctypeHandler } from '@ceramicnetwork/doctype-tile-handler';
import { Caip10LinkDoctypeHandler } from '@ceramicnetwork/doctype-caip10-link-handler';
import { Doctype, DoctypeHandler } from '@ceramicnetwork/common';
import { DiagnosticsLogger } from '@ceramicnetwork/common';

/**
 * Container for doctype handlers. Maps doctype name to the handler instance.
 */
export class HandlersMap {
  private readonly handlers: Map<string, DoctypeHandler<Doctype>>;

  constructor(private readonly logger: DiagnosticsLogger, handlers?: Map<string, DoctypeHandler<Doctype>>) {
    this.handlers =
      handlers || new Map().set('tile', new TileDoctypeHandler()).set('caip10-link', new Caip10LinkDoctypeHandler());
  }

  /**
   * Return doctype handler based on its name. Throw error if not found.
   *
   * @param doctypeName - name of the handler.
   */
  get<T extends Doctype>(doctypeName: string): DoctypeHandler<T> {
    const handler = this.handlers.get(doctypeName);
    if (handler) {
      return handler as DoctypeHandler<T>;
    } else {
      throw new Error(doctypeName + ' is not a valid doctype');
    }
  }

  /**
   * Add doctype handler to the collection.
   */
  add<T extends Doctype>(doctypeHandler: DoctypeHandler<T>): HandlersMap {
    this.logger.debug(`Registered handler for ${doctypeHandler.name} doctype`);
    this.handlers.set(doctypeHandler.name, doctypeHandler);
    return this;
  }
}
