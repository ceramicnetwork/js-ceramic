import CeramicDaemon from './ceramic-daemon'
import CeramicClient from '@ceramicnetwork/ceramic-http-client'
import program from 'commander'
import { DoctypeUtils } from "@ceramicnetwork/ceramic-common"


const PREFIX_REGEX = /^ceramic:\/\/|^\/ceramic\//
function validateDocId (docId: string): string {
  const match = docId.match(PREFIX_REGEX)
  return match ? match[0] : null
}

const DEFAULT_PINNING_STORE_PATH = ".pinning.store"

program
  .command('daemon')
  .option('--ipfs-api <url>', 'The ipfs http api to use')
  .option('--ethereum-rpc <url>', 'The Ethereum RPC URL used for communicating with Ethereum blockchain')
  .option('--anchor-service-api <url>', 'The anchor service URL to use')
  .option('--pinning-store-path <url>', 'The directory path used for pinning service. Defaults to' +
      ' WORKING_DIR/' + DEFAULT_PINNING_STORE_PATH)
  .description('Start the daemon')
  .action(async ({ ipfsApi, ethereumRpc, anchorServiceApi, stateStorePath }) => {
      if (stateStorePath == null) {
          stateStorePath = DEFAULT_PINNING_STORE_PATH
      }
      await CeramicDaemon.create({
        ipfsHost: ipfsApi,
        ethereumRpcUrl: ethereumRpc,
        anchorServiceUrl: anchorServiceApi,
        stateStorePath: stateStorePath,
    })
  })

program
  .command('create <doctype> <new-content>')
  .option('--only-genesis', 'Only create the genesis object. No anchor will be created')
  .option('--owners <owners>', 'Specify a comma-separated list of the owners of the document. Defaults to current user')
  .option('--schema <docId>', 'Interactively create a new document using a given schema.')
  .option('--unique', 'Ensure document is unique regardless of content')
  .description('Create a new document')
  .action(async (doctype, content, { onlyGenesis, owners, unique }) => {
    content = JSON.parse(content)
    if (typeof owners === 'string') owners = owners.split(',')
    const ceramic = new CeramicClient()
    try {
      const doc = await ceramic.createDocument(doctype, { content, owners }, { applyOnly: onlyGenesis, isUnique: unique })
      console.log(doc.id)
      console.log(JSON.stringify(doc.content, null, 2))
    } catch (e) {
      console.error(e)
    }
    ceramic.close()
  })


program
  .command('show <docId> [<anchor>]')
  .description('Show the content of a document')
  .action(async (docId) => {
    if (!validateDocId(docId)) {
      console.error(`Invalid docId: ${docId}`)
      return
    }
    const ceramic = new CeramicClient()
    try {
      const doc = await ceramic.loadDocument(docId)
      console.log(JSON.stringify(doc.content, null, 2))
    } catch (e) {
      console.error(e)
    }
    ceramic.close()
  })

program
  .command('state <docId> [<anchor>]')
  .description('Show the state of a document')
  .action(async (docId) => {
    if (!validateDocId(docId)) {
      console.error(`Invalid docId: ${docId}`)
      return
    }
    const ceramic = new CeramicClient()
    try {
      const doc = await ceramic.loadDocument(docId)
      console.log(JSON.stringify(DoctypeUtils.serializeState(doc.state), null, 2))
    } catch (e) {
      console.error(e)
    }
    ceramic.close()
  })

program
  .command('watch <docId>')
  .description('Watch for updates in a document')
  .action(async (docId) => {
    if (!validateDocId(docId)) {
      console.error(`Invalid docId: ${docId}`)
      return
    }
    const ceramic = new CeramicClient()
    try {
      const doc = await ceramic.loadDocument(docId)
      console.log(JSON.stringify(doc.content, null, 2))
      doc.on('change', () => {
        console.log('--- document changed ---')
        console.log(JSON.stringify(doc.content, null, 2))
      })
    } catch (e) {
      console.error(e)
    }
  })

const pin = program.command('pin')
pin.description('Ceramic local pinning API')

pin
    .command('add <docId>')
    .description('Pin document')
    .action(async (docId) => {
        if (!validateDocId(docId)) {
            console.error(`Invalid docId: ${docId}`)
            return
        }
        const ceramic = new CeramicClient()
        try {
            const result = await ceramic.pin.add(docId)
            console.log(JSON.stringify(result, null, 2))
        } catch (e) {
            console.error(e)
        }
        ceramic.close()
    });

pin
    .command('rm <docId>')
    .description('Unpin document')
    .action(async (docId) => {
        if (!validateDocId(docId)) {
            console.error(`Invalid docId: ${docId}`)
            return
        }
        const ceramic = new CeramicClient()
        try {
            const result = await ceramic.pin.rm(docId)
            console.log(JSON.stringify(result, null, 2))
        } catch (e) {
            console.error(e)
        }
        ceramic.close()
    });

pin
    .command('ls [<docId>]')
    .description('List pinned documents')
    .action(async (docId) => {
        if (docId != null && !validateDocId(docId)) {
            console.error(`Invalid docId: ${docId}`)
            return
        }
        const ceramic = new CeramicClient()
        try {
            const pinnedDocIds = []
            const iterator = await ceramic.pin.ls(docId)
            for await (const id of iterator) {
                pinnedDocIds.push(id)
            }
            console.log(JSON.stringify(pinnedDocIds, null, 2))
        } catch (e) {
            console.error(e)
        }
        ceramic.close()
    })

program.parse(process.argv)
