import InMemoryAnchorService from '../../anchor/memory/in-memory-anchor-service'
import { Stream } from '@ceramicnetwork/common'
import Ceramic from '../../ceramic'

export async function anchorUpdate(ceramic: Ceramic, stream: Stream): Promise<void> {
  const tillAnchored = stream.waitForAnchor()
  const anchorService = ceramic.context.anchorService as InMemoryAnchorService
  await anchorService.anchor()
  await tillAnchored
}
