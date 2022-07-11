import { Ceramic } from '@ceramicnetwork/core'
import getPort from 'get-port'
import { CeramicDaemon } from '../ceramic-daemon.js'
import { DaemonConfig } from '../daemon-config.js'

export async function makeCeramicDaemon(core: Ceramic): Promise<CeramicDaemon> {
  const port = await getPort()
  const daemon = new CeramicDaemon(core, DaemonConfig.fromObject({ 'http-api': { port } }))
  await daemon.listen()
  return daemon
}
