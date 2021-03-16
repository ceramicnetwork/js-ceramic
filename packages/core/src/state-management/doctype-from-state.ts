import { Context, Doctype, DoctypeUtils } from '@ceramicnetwork/common';
import { HandlersMap } from '../handlers-map';
import { RunningState } from './running-state';

// Should be removed when Doctype accepts RunningStateLike
export function doctypeFromState<T extends Doctype>(
  context: Context,
  handlersMap: HandlersMap,
  state$: RunningState,
  isReadonly = false,
): T {
  const handler = handlersMap.get<T>(state$.value.doctype);
  const doctype = new handler.doctype(state$.value, context);
  state$.subscribe((state) => {
    doctype.state = state;
    doctype.emit('change');
  });
  return isReadonly ? DoctypeUtils.makeReadOnly(doctype) : doctype;
}
