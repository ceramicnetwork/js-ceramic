import { IpfsApi } from '@ceramicnetwork/common'
import { Ceramic } from '@ceramicnetwork/core'
import { TileDocumentHandler } from '@ceramicnetwork/stream-tile-handler'

export async function makeCeramicCore(
  ipfs: IpfsApi,
  stateStoreDirectory: string
): Promise<Ceramic> {
  const core = await Ceramic.create(ipfs, {
    pubsubTopic: '/ceramic',
    stateStoreDirectory,
    anchorOnRequest: false,
    indexing: {
      db: `sqlite://${stateStoreDirectory}/ceramic.sqlite`,
      allowQueriesBeforeHistoricalSync: true,
    },
  })

  const handler = new TileDocumentHandler()
  ;(handler as any).verifyJWS = (): Promise<void> => {
    return
  }
  // @ts-ignore
  core._streamHandlers.add(handler)
  return core
}
