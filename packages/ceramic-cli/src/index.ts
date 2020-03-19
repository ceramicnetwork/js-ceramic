import CeramicDaemon from './ceramic-daemon'
import CeramicClient from './ceramic-client'
import program from 'commander'

program
  .command('daemon')
  .option('--ipfs-api <url>', 'The ipfs http api to use')
  .option('--disable-pinning', 'Disable pinning thought the http api')
  .description('Start the daemon')
  .action(async () => { await CeramicDaemon.create() })

program
  .command('create <doctype> <new-content>')
  .option('--only-genesis', 'Only create the genesis object. No signature and anchore will be created')
  .option('--owners <owners>', 'Specify the owners of the document. Defaults to current user')
  .description('Create a new document')
  .action(async (doctype, content, { onlyGenesis }) => {
    content = JSON.parse(content)
    const ceramic = new CeramicClient()
    const doc = await ceramic.createDocument(content, doctype, { onlyGenesis })
    console.log(doc.id)
    console.log(JSON.stringify(doc.content, null, 2))
    ceramic.close()
  })

program
  .command('show <docId>')
  .option('-v, --version <number>', 'Specify the version of the document to show')
  .description('Show the content of a document')
  .action(async (docId) => {
    const ceramic = new CeramicClient()
    const doc = await ceramic.loadDocument(docId)
    console.log(JSON.stringify(doc.content, null, 2))
    ceramic.close()
  })

program
  .command('state <docId>')
  .description('Show the state of a document')
  .action(async (docId) => {
    const ceramic = new CeramicClient()
    const doc = await ceramic.loadDocument(docId)
    console.log(JSON.stringify(doc.state, null, 2))
    ceramic.close()
  })

program
  .command('watch <docId>')
  .description('Watch for updates in a document')
  .action(async (docId) => {
    const ceramic = new CeramicClient()
    const doc = await ceramic.loadDocument(docId)
    console.log(JSON.stringify(doc.content, null, 2))
    doc.on('change', () => {
      console.log('--- document changed ---')
      console.log(JSON.stringify(doc.content, null, 2))
    })
  })

program
  .command('change <docId> <content>')
  .option('--owners <owners>', 'Change owner of this document (only 3ID)')
  .description('Update the content of a document')
  .action(async (docId, content) => {
    content = JSON.parse(content)
    const ceramic = new CeramicClient()
    const doc = await ceramic._updateDocument(docId, content)
    console.log(JSON.stringify(doc.id, null, 2))
    ceramic.close()
  })

program.parse(process.argv)
