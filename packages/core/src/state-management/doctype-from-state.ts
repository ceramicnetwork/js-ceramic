import { Context, DocState, Doctype, DoctypeUtils } from '@ceramicnetwork/common';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { HandlersMap } from '../handlers-map';
import { StateLink } from './state-link';

export function doctypeFromState<T extends Doctype>(
  context: Context,
  handlersMap: HandlersMap,
  state: DocState,
  feed$: Observable<DocState>,
  isReadonly = false,
): T {
  const handler = handlersMap.get<T>(state.doctype);
  const state$ = new StateLink(state, feed$.pipe(filter((s) => s.log[0].cid.equals(state.log[0].cid))));
  const doctype = new handler.doctype(state$, context);
  return isReadonly ? DoctypeUtils.makeReadOnly(doctype) : doctype;
}
