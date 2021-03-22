import { Context, Doctype, DoctypeUtils, RunningStateLike } from '@ceramicnetwork/common';
import { HandlersMap } from '../handlers-map';

// Should be removed when Doctype accepts RunningStateLike
export function doctypeFromState<T extends Doctype>(
  context: Context,
  handlersMap: HandlersMap,
  state$: RunningStateLike,
  isReadonly = false,
): T {
  const handler = handlersMap.get<T>(state$.value.doctype);
  const doctype = new handler.doctype(state$, context);
  return isReadonly ? DoctypeUtils.makeReadOnly(doctype) : doctype;
}
