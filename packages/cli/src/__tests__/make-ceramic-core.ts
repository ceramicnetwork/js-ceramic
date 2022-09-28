import { IpfsApi } from '@ceramicnetwork/common'
import { Ceramic } from '@ceramicnetwork/core'
import { TileDocumentHandler } from '@ceramicnetwork/stream-tile-handler'
import { StreamID } from '@ceramicnetwork/streamid'

export async function makeCeramicCore(
  ipfs: IpfsApi,
  stateStoreDirectory: string,
  modelsToIndex: Array<string> = []
): Promise<Ceramic> {
  const core = await Ceramic.create(ipfs, {
    adminDids: ['did:key:z6MkgwMzPmLuvUiWsQfyQeGpNRRNkLyCB5cL96fPshy1DKJd'],
    pubsubTopic: '/ceramic',
    stateStoreDirectory,
    anchorOnRequest: false,
    indexing: {
      db: `sqlite://${stateStoreDirectory}/ceramic.sqlite`,
      models: modelsToIndex.map(StreamID.fromString),
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
