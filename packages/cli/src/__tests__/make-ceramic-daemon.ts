import { Ceramic } from '@ceramicnetwork/core'
import getPort from 'get-port'
import { CeramicDaemon } from '../ceramic-daemon.js'
import { DaemonConfig } from '../daemon-config.js'
import merge from 'lodash.merge'

export async function makeCeramicDaemon(
  core: Ceramic,
  opts: Record<string, any> = {}
): Promise<CeramicDaemon> {
  const port = await getPort()

  const configObj = merge(
    {
      'http-api': { port },
      indexing: {},
      node: {
        'private-seed-url':
          'inplace:ed25519#85704d3f4712d11be488bff0590eead8d4971b2c16b32ea23d6a00d53f3e7dad',
      },
    },
    opts
  )

  const daemon = new CeramicDaemon(core, DaemonConfig.fromObject(configObj))
  await daemon.listen()
  return daemon
}
