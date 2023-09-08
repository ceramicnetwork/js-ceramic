import { CeramicCliUtils, CeramicDaemon } from '@ceramicnetwork/cli'
import * as process from 'node:process'
import os from 'os'
import { ethers } from 'ethers'
import { EthereumNodeAuth, getAccountId } from '@didtools/pkh-ethereum'
import { DIDSession } from 'did-session'
import { TileDocument } from '@ceramicnetwork/stream-tile'

const HOMEDIR = new URL(`file://${os.homedir()}/`)
const DEFAULT_CONFIG_PATH = new URL('.ceramic/', HOMEDIR)
const DEFAULT_DAEMON_CONFIG_FILENAME = new URL('daemon.config.json', DEFAULT_CONFIG_PATH)

async function main() {
  const configFilepath = DEFAULT_DAEMON_CONFIG_FILENAME
  const config = await CeramicCliUtils._loadDaemonConfig(configFilepath)
  const daemon = await CeramicDaemon.create(config)

  const ethProvider = ethers.getDefaultProvider('goerli')
  const wallet = ethers.Wallet.fromPhrase(
    'enhance right mistake keep lady code judge decrease card write govern remind'
  ).connect(ethProvider)
  const address = await wallet.getAddress()
  const provider = {
    request: async (params: { method: string; params: string[] }) => {
      switch (params.method) {
        case 'eth_chainId': {
          const chainId = await ethProvider.getNetwork()
          return String(chainId.chainId)
        }
        case 'personal_sign': {
          const signature = await wallet.signMessage(params.params[0])
          return signature
        }
        default:
          console.log('params', params)
          throw new Error(`nope`)
      }
    },
  }

  const accountId = await getAccountId(provider, address)
  const authMethod = await EthereumNodeAuth.getAuthMethod(provider, accountId, 'test')
  console.log('ok')
  const session = await DIDSession.authorize(authMethod, { resources: ['ceramic://*'] })
  daemon.ceramic.did = session.did

  const tile = await TileDocument.create(
    daemon.ceramic,
    { hello: `1-${Math.random()}` },
    undefined,
    { anchor: true }
  )
  await tile.update({ hello: `2-${Math.random()}` }, undefined, { anchor: true })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
