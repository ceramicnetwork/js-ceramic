import CeramicDaemon from './ceramic-daemon'
import CeramicClient from '@ceramicnetwork/ceramic-http-client'
import program from 'commander'


program
  .command('daemon')
  .option('--ipfs-api <url>', 'The ipfs http api to use')
  .option('--disable-pinning', 'Disable pinning thought the http api')
  .description('Start the daemon')
  .action(async () => { await CeramicDaemon.create() })

program
  .command('create <doctype> <new-content>')
  .option('--only-genesis', 'Only create the genesis object. No anchor will be created')
  .option('--owners <owners>', 'Specify a comma-separated list of the owners of the document. Defaults to current user')
  .option('--schema <docId>', 'Interactively create a new document using a given schema.')
  .description('Create a new document')
  .action(async (doctype, content, { onlyGenesis, owners }) => {
    content = JSON.parse(content)
    if (typeof owners === 'string') owners = owners.split(',')
    const ceramic = new CeramicClient()
    try {
      const doc = await ceramic.createDocument(content, doctype, { onlyGenesis, owners })
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
    const ceramic = new CeramicClient()
    try {
      const doc = await ceramic.loadDocument(docId)
      console.log(JSON.stringify(doc.state, null, 2))
    } catch (e) {
      console.error(e)
    }
    ceramic.close()
  })

program
  .command('watch <docId>')
  .description('Watch for updates in a document')
  .action(async (docId) => {
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

program
  .command('change <docId> <content>')
  .option('--owners <owners>', 'Change owner of this document (only 3ID)')
  .description('Update the content of a document')
  .action(async (docId, content) => {
    content = JSON.parse(content)
    const ceramic = new CeramicClient()
    try {
      const doc = await ceramic._updateDocument(docId, content)
      console.log(JSON.stringify(doc.content, null, 2))
    } catch (e) {
      console.error(e)
    }
    ceramic.close()
  })

program.parse(process.argv)
