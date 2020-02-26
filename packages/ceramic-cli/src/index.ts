import CeramicDaemon from './ceramic-daemon'
import CeramicClient from './ceramic-client'
import program from 'commander'

const VERSION = '0.0.0'

program.version(VERSION, '-v, --version', 'output the version number')

program
  .command('daemon')
  .option('--ipfs-api <url>', 'The http ipfs api to use')
  .description('Start the daemon')
  .action(async () => { await CeramicDaemon.create() })

program
  .command('create <doctype> <new-content>')
  .option('--only-genesis', 'Only create the genesis object. No signature and anchore will be created')
  .description('Create a new document')
  .action(async (doctype, content, { onlyGenesis }) => {
    content = JSON.parse(content)
    const ceramic = new CeramicClient()
    const doc = await ceramic.createDocument(content, doctype, { onlyGenesis })
    console.log(doc.id)
    console.log(JSON.stringify(doc.content, null, 2))
  })

program
  .command('show <docId>')
  .description('Show the content of a document')
  .action(async (docId) => {
    const ceramic = new CeramicClient()
    const doc = await ceramic.loadDocument(docId)
    console.log(JSON.stringify(doc.content, null, 2))
  })

program
  .command('state <docId>')
  .description('Show the state of a document')
  .action(async (docId) => {
    const ceramic = new CeramicClient()
    const doc = await ceramic.loadDocument(docId)
    console.log(JSON.stringify(doc.state, null, 2))
  })

program
  .command('watch <docId>')
  .description('Watch for updates in a document')
  .action(async (docId) => {
    //const ceramic = new CeramicClient()
    //const doc = await ceramic.loadDocument(docId)
    //console.log(JSON.stringify(doc.content, null, 2))
  })

program
  .command('change <docId> <content>')
  .description('Update the content of a document')
  .action(async (docId, content) => {
    content = JSON.parse(content)
    const ceramic = new CeramicClient()
    const doc = await ceramic._updateDocument(docId, content)
    console.log(JSON.stringify(doc.id, null, 2))
  })

program.parse(process.argv)
