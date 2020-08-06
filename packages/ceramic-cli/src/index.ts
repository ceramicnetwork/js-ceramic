import program from 'commander'

import CeramicDaemon from './ceramic-daemon'
import CeramicCliUtils from "./ceramic-cli-utils"

const DEFAULT_PINNING_STORE_PATH = ".pinning.store"

program
    .command('daemon')
    .option('--ipfs-api <url>', 'The ipfs http api to use')
    .option('--ethereum-rpc <url>', 'The Ethereum RPC URL used for communicating with Ethereum blockchain')
    .option('--anchor-service-api <url>', 'The anchor service URL to use')
    .option('--validate-docs', 'Validate documents according to their schemas. It is enabled by default')
    .option('--pinning <url...>', 'Pinning endpoints')
    .option('--pinning-store-path <url>', `The directory path used for pinning service. Defaults to WORKING_DIR/${DEFAULT_PINNING_STORE_PATH}`)
    .description('Start the daemon')
    .action(async ({ ipfsApi, ethereumRpc, anchorServiceApi, stateStorePath, validateDocs, pinning }) => {
        if (stateStorePath == null) {
            stateStorePath = DEFAULT_PINNING_STORE_PATH
        }
        await CeramicDaemon.create({
            ipfsHost: ipfsApi,
            ethereumRpcUrl: ethereumRpc,
            anchorServiceUrl: anchorServiceApi,
            stateStorePath: stateStorePath,
            validateDocs,
            pinning: pinning
        })
    })

program
    .command('create <doctype>')
    .option('--content <content>', 'New document content')
    .option('--only-genesis', 'Only create the genesis object. No anchor will be created')
    .option('--owners <owners>', 'Specify a comma-separated list of the owners of the document. Defaults to current user')
    .option('--unique', 'Ensure document is unique regardless of content')
    .option('--schema <schema>', 'Schema document ID')
    .description('Create a new document')
    .action(async (doctype, { content, onlyGenesis, owners, unique, schema }) => {
        await CeramicCliUtils.createDoc(doctype, content, owners, onlyGenesis, unique, schema)
    })

program
    .command('change <docId>')
    .option('--content <content>', 'Change document content')
    .option('--owners <owners>', 'Change owner of this document (only 3ID)')
    .option('--schema <schema>', 'Change the schema document ID')
    .description('Update the content of a document')
    .action(async (docId, { content, owners, schema }) => {
        await CeramicCliUtils.change(docId, content, owners, schema)
    })

program
    .command('show <docId> [<anchor>]')
    .description('Show the content of a document')
    .action(async (docId) => {
        await CeramicCliUtils.show(docId)
    })

program
    .command('state <docId> [<anchor>]')
    .description('Show the state of a document')
    .action(async (docId) => {
        await CeramicCliUtils.state(docId)
    })

program
    .command('watch <docId>')
    .description('Watch for updates in a document')
    .action(async (docId) => {
        await CeramicCliUtils.watch(docId)
    })

program
    .command('versions <docId>')
    .description('List document versions')
    .action(async (docId) => {
        await CeramicCliUtils.versions(docId)
    })

const schemas = program.command('schema')
schemas.description('Ceramic schemas')

schemas
    .command('create <new-content>')
    .option('--only-genesis', 'Only create the genesis object. No anchor will be created')
    .option('--owners <owners>', 'Specify a comma-separated list of the owners of the schema document. Defaults to' +
        ' current user')
    .option('--unique', 'Ensure schema document is unique regardless of content')
    .description('Create a new schema')
    .action(async (content, { onlyGenesis, owners, unique }) => {
        await CeramicCliUtils.schemaCreateDoc(content, owners, onlyGenesis, unique)
    })

schemas
    .command('change <docId> <new-content>')
    .option('--owners <owners>', 'Change owner of this document (only 3ID)')
    .description('Update the content of a schema')
    .action(async (docId, content, { owners }) => {
        await CeramicCliUtils.schemaChangeDoc(docId, content, owners)
    })

schemas
    .command('validate <schemaDocId> <new-content>')
    .description('Validate content with schema')
    .action(async (schemaDocId, content) => {
        await CeramicCliUtils.schemaValidateContent(schemaDocId, content)
    })

const pin = program.command('pin')
pin.description('Ceramic local pinning API')

pin
    .command('add <docId>')
    .description('Pin document')
    .action(async (docId) => {
        await CeramicCliUtils.pinAdd(docId)
    });

pin
    .command('rm <docId>')
    .description('Unpin document')
    .action(async (docId) => {
        await CeramicCliUtils.pinRm(docId)
    });

pin
    .command('ls [<docId>]')
    .description('List pinned documents')
    .action(async (docId) => {
        await CeramicCliUtils.pinLs(docId)
    })

program.parse(process.argv)
