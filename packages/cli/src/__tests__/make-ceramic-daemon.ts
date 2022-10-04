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
      indexing: {
        'allow-queries-before-historical-sync': true,
      },
    },
    opts
  )

  const daemon = new CeramicDaemon(core, DaemonConfig.fromObject(configObj))
  await daemon.listen()
  return daemon
}
