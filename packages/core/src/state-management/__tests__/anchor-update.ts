import { filter, take } from 'rxjs/operators'
import InMemoryAnchorService from '../../anchor/memory/in-memory-anchor-service'
import { AnchorStatus, Stream } from '@ceramicnetwork/common'
import Ceramic from '../../ceramic'

export async function anchorUpdate(ceramic: Ceramic, stream: Stream): Promise<void> {
  const tillAnchored = stream
    .pipe(
      filter((state) => [AnchorStatus.ANCHORED, AnchorStatus.FAILED].includes(state.anchorStatus)),
      take(1)
    )
    .toPromise()
  const anchorService = ceramic.context.anchorService as InMemoryAnchorService
  await anchorService.anchor()
  await tillAnchored
}
