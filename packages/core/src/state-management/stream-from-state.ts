import { Context, StreamState, Stream } from '@ceramicnetwork/common';
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
export function streamFromState<T extends Stream>(
  context: Context,
  handlersMap: HandlersMap,
  state: StreamState,
  update$?: (init: StreamState) => Observable<StreamState>,
): T {
  const handler = handlersMap.get<T>(state.type);
  const state$ = new StateLink(state, update$);
  const stream = new handler.stream_constructor(state$, context);
  if (!update$) {
    stream.makeReadOnly()
  }

  return stream;
}
