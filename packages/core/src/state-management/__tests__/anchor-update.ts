import { filter, take } from 'rxjs/operators'
import InMemoryAnchorService from '../../anchor/memory/in-memory-anchor-service'
import { AnchorStatus, Stream } from '@ceramicnetwork/common'
import Ceramic from '../../ceramic'

export async function anchorUpdate(ceramic: Ceramic, stream: Stream<any>): Promise<void> {
  // TODO update this to only use public apis
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const tillAnchored = stream.state$
    .pipe(
      filter((state) => [AnchorStatus.ANCHORED, AnchorStatus.FAILED].includes(state.anchorStatus)),
      take(1)
    )
    .toPromise()
  const anchorService = ceramic.context.anchorService as InMemoryAnchorService
  await anchorService.anchor()
  await tillAnchored
}
