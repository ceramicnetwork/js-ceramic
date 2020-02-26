import CeramicDaemon from './ceramic-daemon'
import CeramicClient from './ceramic-client'
import program from 'commander'

const VERSION = '0.0.0'

program.version(VERSION, '-v, --version', 'output the version number')

program
  .command('daemon')
  .option('--ipfs-api <url>', 'The http ipfs api to use')
  .description('Start the daemon')
  .action(async () => {
    const daemon = await CeramicDaemon.create()
  })

program
  .command('create <doctype> <new-content>')
  .option('--only-genesis', 'Only create the genesis object. No signature and anchore will be created')
  .description('Create a new document')
  .action((doctype, content, { onlyGenesis }) => {
    console.log('clone command called', doctype, content, onlyGenesis)
  })

program
  .command('show <path>')
  .description('Show the content of a document')
  .action((path) => {
    console.log('clone command called', path)
  })

program
  .command('status <path>')
  .description('Show the status of a document')
  .action((path) => {
    console.log('clone command called', path)
  })

program
  .command('watch <path>')
  .description('Watch for updates in a document')
  .action((path) => {
    console.log('clone command called', path)
  })

program
  .command('change <path> <content>')
  .description('Update the content of a document')
  .action((path, content) => {
    console.log('clone command called', path, content)
  })

program.parse(process.argv)
