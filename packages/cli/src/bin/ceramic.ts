import program from 'commander'

import { CeramicCliUtils } from '../ceramic-cli-utils'

program
  .command('daemon')
  .option('--ipfs-api <url>', 'The ipfs http api to use')
  .option(
    '--ethereum-rpc <url>',
    'The Ethereum RPC URL used for communicating with Ethereum blockchain'
  )
  .option('--anchor-service-api <url>', 'The anchor service URL to use')
  .option(
    '--validate-streams',
    'Validate streams according to their schemas. It is enabled by default'
  )
  .option('--ipfs-pinning-endpoint <url...>', 'Ipfs pinning endpoints')
  .option(
    '--state-store-directory <string>',
    `The directory path used for storing pinned stream state. Defaults to HOME_DIR/.ceramic/statestore`
  )
  .option(
    '--state-store-s3-bucket <string>',
    `The S3 bucket name to use for storing pinned stream state. If not provided pinned stream state will only be saved locally but not to S3.`
  )
  .option('--gateway', 'Makes read only endpoints available. It is disabled by default')
  .option('--port <int>', 'Port daemon is available on. Default is 7007')
  .option('--hostname <string>', 'Host daemon is available on. Default is 0.0.0.0')
  .option('--debug', 'Enable debug logging level. Default is false')
  .option('--verbose', 'Enable verbose logging level. Default is false')
  .option('--log-to-files', 'If debug is true, write logs to files. Default is false')
  .option(
    '--log-directory <dir>',
    'Store logs in this directory. Defaults to HOME_DIR/.ceramic/logs'
  )
  .option(
    '--network <name>',
    'Name of the ceramic network to connect to. One of: "mainnet", "testnet-clay", "dev-unstable", "local", or "inmemory". Defaults to "testnet-clay"'
  )
  .option('--pubsubTopic <string>', 'Pub/sub topic to use for protocol messages')
  .option(
    '--max-healthy-cpu <decimal>',
    'Fraction of total CPU usage considered healthy. Defaults to 0.7'
  )
  .option(
    '--max-healthy-memory <decimal>',
    'Fraction of total memory usage considered healthy. Defaults to 0.7'
  )
  .option(
    '--cors-allowed-origins <list>',
    'Space-separated list of strings and/or regex expressions to set for Access-Control-Allow-Origin . Defaults to all: "*"'
  )
  .option(
    '--sync-override <string>',
    'Global forced mode for syncing all streams. One of: "prefer-cache", "sync-always", or "never-sync". Defaults to "prefer-cache"'
  )
  .description('Start the daemon')
  .action(
    async ({
      ipfsApi,
      ethereumRpc,
      anchorServiceApi,
      validateStreams,
      ipfsPinningEndpoint,
      stateStoreDirectory,
      stateStoreS3Bucket,
      gateway,
      port,
      hostname,
      debug,
      verbose,
      logToFiles,
      logDirectory,
      network,
      pubsubTopic,
      corsAllowedOrigins,
      syncOverride,
    }) => {
      if (stateStoreDirectory && stateStoreS3Bucket) {
        throw new Error(
          'Cannot specify both --state-store-directory and --state-store-s3-bucket. Only one state store - either on local storage or on S3 - can be used at a time'
        )
      }
      await CeramicCliUtils.createDaemon(
        ipfsApi,
        ethereumRpc,
        anchorServiceApi,
        validateStreams,
        ipfsPinningEndpoint,
        stateStoreDirectory,
        stateStoreS3Bucket,
        gateway,
        port,
        hostname,
        debug,
        verbose,
        logToFiles,
        logDirectory,
        network,
        pubsubTopic,
        corsAllowedOrigins,
        syncOverride
      ).catch((err) => {
        console.error('Ceramic daemon failed to start up:')
        console.error(err)
        process.exit(1)
      })
    }
  )

program
  .command('create <streamtype>')
  .option('--content <content>', 'New document content')
  .option('--only-genesis', 'Only create the genesis object. No anchor will be created')
  .option(
    '--controllers <controllers>',
    'Specify a comma-separated list of the controllers of the document. Controllers are the users that are allowed to publish updates to this document. Defaults to current user'
  )
  .option(
    '--deterministic',
    'Document content is created deterministically from the inputs.  This means ' +
      'that creating a document with identical content to an existing document will be a no-op.'
  )
  .option('--schema <schema>', 'Schema document ID')
  .description('Create a new document')
  .action(async (streamtype, { content, onlyGenesis, controllers, deterministic, schema }) => {
    if (streamtype != 'tile') {
      throw new Error("CLI does not currently support creating stream types other than 'tile'")
    }
    await CeramicCliUtils.nonSchemaCreateDoc(
      content,
      controllers,
      onlyGenesis,
      deterministic,
      schema
    )
  })

program
  .command('update <streamId>')
  .option('--content <content>', 'Update document content')
  .option('--controllers <controllers>', 'Change controllers of this document (only 3ID)')
  .option('--schema <schema>', 'Change the schema CommitID')
  .description('Update the content of a document')
  .action(async (streamId, { content, controllers, schema }) => {
    await CeramicCliUtils.update(streamId, content, controllers, schema)
  })

program
  .command('show <streamId> [<anchor>]')
  .description('Show the content of a stream')
  .action(async (streamId) => {
    await CeramicCliUtils.show(streamId)
  })

program
  .command('state <streamId> [<anchor>]')
  .description('Show the state of a stream')
  .action(async (streamId) => {
    await CeramicCliUtils.state(streamId)
  })

program
  .command('watch <streamId>')
  .description('Watch for updates in a stream')
  .action(async (streamId) => {
    await CeramicCliUtils.watch(streamId)
  })

program
  .command('commits <streamId>')
  .description('List stream commits')
  .action(async (streamId) => {
    await CeramicCliUtils.commits(streamId)
  })

const schemas = program.command('schema')
schemas.description('Ceramic schemas')

schemas
  .command('create <new-content>')
  .option('--only-genesis', 'Only create the genesis object. No anchor will be created')
  .option(
    '--controllers <controllers>',
    'Specify a comma-separated list of the controllers of the schema document. Defaults to' +
      ' current user'
  )
  .option(
    '--deterministic',
    'Document content is created deterministically from the inputs.  This means ' +
      'that creating a schema document with identical content to an existing schema document ' +
      'will be a no-op.'
  )
  .description('Create a new schema')
  .action(async (content, { onlyGenesis, controllers, deterministic }) => {
    await CeramicCliUtils.schemaCreateDoc(content, controllers, onlyGenesis, deterministic)
  })

schemas
  .command('update <streamId> <new-content>')
  .option('--controllers <controllers>', 'Change controllers of this document (only 3ID)')
  .description('Update the content of a schema')
  .action(async (streamId, content, { controllers }) => {
    await CeramicCliUtils.schemaUpdateDoc(streamId, content, controllers)
  })

const pin = program.command('pin')
pin.description('Ceramic local pinning API')

pin
  .command('add <streamId>')
  .description('Pin stream')
  .action(async (streamId) => {
    await CeramicCliUtils.pinAdd(streamId)
  })

pin
  .command('rm <streamId>')
  .description('Unpin stream')
  .action(async (streamId) => {
    await CeramicCliUtils.pinRm(streamId)
  })

pin
  .command('ls [<streamId>]')
  .description('List pinned streams')
  .action(async (streamId) => {
    await CeramicCliUtils.pinLs(streamId)
  })

const config = program.command('config')
config.description('CLI Ceramic configuration. Configurable parameters: seed, ceramicHost ')

config
  .command('show')
  .description('Show CLI Ceramic configuration')
  .action(async () => {
    await CeramicCliUtils.showCliConfig()
  })

config
  .command('set <variable> <value>')
  .description('Set variable value')
  .action(async (variable, value) => {
    await CeramicCliUtils.setCliConfig(variable, value)
  })

config
  .command('unset <variable>')
  .description('Unset configuration variable')
  .action(async (variable) => {
    await CeramicCliUtils.unsetCliConfig(variable)
  })

program.parse(process.argv)
