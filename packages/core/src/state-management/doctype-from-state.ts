import { Context, DocState, Stream } from '@ceramicnetwork/common';
import { Observable } from 'rxjs';
import { HandlersMap } from '../handlers-map';
import { StateLink } from './state-link';

/**
 * Build Stream from the current state and update feed.
 *
 * @param context - Ceramic context
 * @param handlersMap - available doctype handlers
 * @param state - current state of the doctype
 * @param update$ - On-demand feed of updates for the document
 */
export function doctypeFromState<T extends Stream>(
  context: Context,
  handlersMap: HandlersMap,
  state: DocState,
  update$?: (init: DocState) => Observable<DocState>,
): T {
  const handler = handlersMap.get<T>(state.type);
  const state$ = new StateLink(state, update$);
  const doctype = new handler.doctype(state$, context);
  if (!update$) {
    doctype.makeReadOnly()
  }

  return doctype;
}
