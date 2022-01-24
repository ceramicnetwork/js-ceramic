import { Context, StreamState, Stream } from '@ceramicnetwork/common'
import { Observable } from 'rxjs'
import { HandlersMap } from '../handlers-map.js'
import { StateLink } from './state-link.js'

/**
 * Build Stream from the current state and update feed.
 *
 * @param context - Ceramic context
 * @param handlersMap - available stream handlers
 * @param state - current state of the stream
 * @param update$ - On-demand feed of updates for the stream. If not provided then the returned
 *   Stream object is marked read-only and cannot be used to update the stream.
 */
export function streamFromState<T extends Stream>(
  context: Context,
  handlersMap: HandlersMap,
  state: StreamState,
  update$?: (init: StreamState) => Observable<StreamState>
): T {
  const handler = handlersMap.get<T>(state.type)
  const state$ = new StateLink(state, update$)
  const stream = new handler.stream_constructor(state$, context)
  if (!update$) {
    stream.makeReadOnly()
  }

  return stream
}
