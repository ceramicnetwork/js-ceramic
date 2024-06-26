import { IpfsApi } from '@ceramicnetwork/common'
import { Ceramic, VersionInfo } from '@ceramicnetwork/core'
import { TileDocumentHandler } from '@ceramicnetwork/stream-tile-handler'

export async function makeCeramicCore(
  ipfs: IpfsApi,
  stateStoreDirectory: string
): Promise<Ceramic> {
  const core = await Ceramic.create(
    ipfs,
    {
      pubsubTopic: '/ceramic',
      stateStoreDirectory,
      anchorOnRequest: false,
      indexing: {
        db: `sqlite://${stateStoreDirectory}/ceramic.sqlite`,
        allowQueriesBeforeHistoricalSync: true,
        disableComposedb: false,
        enableHistoricalSync: false,
      },
      anchorLoopMinDurationMs: 0,
    },
    {} as VersionInfo
  )

  const handler = new TileDocumentHandler()
  ;(handler as any).verifyJWS = (): Promise<void> => {
    return
  }
  // @ts-ignore
  core._streamHandlers.add(handler)
  return core
}
