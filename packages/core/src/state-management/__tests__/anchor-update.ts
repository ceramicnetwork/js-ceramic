import { filter, take } from 'rxjs/operators';
import InMemoryAnchorService from '../../anchor/memory/in-memory-anchor-service';
import { AnchorStatus, Doctype } from '@ceramicnetwork/common';
import Ceramic from '../../ceramic';

export async function anchorUpdate(ceramic: Ceramic, doc: Doctype): Promise<void> {
  const tillAnchored = doc
    .pipe(
      filter((state) => [AnchorStatus.ANCHORED, AnchorStatus.FAILED].includes(state.anchorStatus)),
      take(1),
    )
    .toPromise();
  const anchorService = ceramic.context.anchorService as InMemoryAnchorService;
  await anchorService.anchor();
  await tillAnchored;
}
