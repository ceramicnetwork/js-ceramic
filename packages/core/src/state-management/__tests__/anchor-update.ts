import { firstValueFrom } from 'rxjs'
import { filter } from 'rxjs/operators'
import { InMemoryAnchorService } from '../../anchor/memory/in-memory-anchor-service.js'
import { AnchorStatus, Stream } from '@ceramicnetwork/common'
import { Ceramic } from '../../ceramic.js'

export async function anchorUpdate(ceramic: Ceramic, stream: Stream): Promise<void> {
  const tillAnchored = firstValueFrom(
    stream.pipe(
      filter((state) => [AnchorStatus.ANCHORED, AnchorStatus.FAILED].includes(state.anchorStatus))
    )
  )
  const anchorService = ceramic.context.anchorService as InMemoryAnchorService
  await anchorService.anchor()
  await tillAnchored
}
