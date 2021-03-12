import { filter, take } from 'rxjs/operators';
import InMemoryAnchorService from '../../anchor/memory/in-memory-anchor-service';
import { Document } from '../../document';
import { AnchorStatus, DocState, Doctype } from '@ceramicnetwork/common';
import Ceramic from '../../ceramic';
import { Observable } from 'rxjs';

export async function anchorUpdate(ceramic: Ceramic, doc: Doctype): Promise<void> {
  const state$ = new Observable<DocState>((subscriber) => {
    const handler = () => {
      subscriber.next(doc.state);
    };
    doc.on('change', handler);
    return () => {
      doc.off('change', handler);
    };
  });
  const anchorService = ceramic.context.anchorService as InMemoryAnchorService;
  await anchorService.anchor();
  await state$
    .pipe(
      filter((state) => [AnchorStatus.ANCHORED, AnchorStatus.FAILED].includes(state.anchorStatus)),
      take(1),
    )
    .toPromise();
}
