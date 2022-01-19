import { createIPFS } from './create-ipfs'
import { HttpApi } from 'ipfs-http-server'
import { HttpGateway } from 'ipfs-http-gateway'
import * as dagJose from 'dag-jose'
import { IpfsTopology } from '@ceramicnetwork/ipfs-topology'
import { DiagnosticsLogger, LogLevel, IpfsApi } from '@ceramicnetwork/common'
import { HealthcheckServer } from './healthcheck-server'
import { createRepo, StorageBackend } from './create-repo'
import path from 'path'
import os from 'os'

export interface Configuration {
  tcpHost: string
  ipfsPath: string
  awsBucketName?: string
  awsAccessKeyId?: string
  awsSecretAccessKey?: string
  announceAddressList: string[]
  ipfsLocalPathPrefix?: string
  ipfsBackendRoot: StorageBackend
  ipfsBackendBlocks: StorageBackend
  ipfsBackendKeys: StorageBackend
  ipfsBackendPins: StorageBackend
  ipfsBackendDatastore: StorageBackend
  ipfsCreateIfMissing: boolean
  ipfsSwarmTcpPort: number
  ipfsSwarmWsPort: number
  ipfsApiPort: number
  ipfsEnableApi: boolean
  ipfsGatewayPort: number
  ipfsEnableGateway: boolean
  ipfsDhtServerMode: boolean
  ipfsEnablePubsub: boolean
  ipfsPubsubTopics: string[]
  ipfsBootstrap: string[]
  ceramicNetwork: string
  useCentralizedPeerDiscovery: boolean
  healthcheckEnabled: boolean
  healthcheckPort: number
  logger: DiagnosticsLogger
}

function fromBooleanInput(input: string | undefined, byDefault?: boolean): boolean {
  if (input) {
    return input == 'true'
  } else {
    return Boolean(byDefault)
  }
}

export class IpfsDaemon {
  constructor(
    readonly configuration: Configuration,
    readonly ipfs: IpfsApi,
    readonly api?: HttpApi,
    readonly gateway?: HttpGateway,
    readonly topology?: IpfsTopology,
    readonly healthcheck?: HealthcheckServer
  ) {}

  static async create(props: Partial<Configuration> = {}): Promise<IpfsDaemon> {
    const ceramicNetwork = props.ceramicNetwork || process.env.CERAMIC_NETWORK
    const useCentralizedPeerDiscovery =
      props.useCentralizedPeerDiscovery ?? process.env.NODE_ENV != 'test'
    const ipfsBootstrap =
      props.ipfsBootstrap ||
      (process.env.IPFS_BOOTSTRAP ? process.env.IPFS_BOOTSTRAP.split(' ') : [])
    const ipfsCreateIfMissing =
      props.ipfsCreateIfMissing ?? fromBooleanInput(process.env.IPFS_CREATE_IF_MISSING, true)
    const configuration: Configuration = {
      tcpHost: props.tcpHost || process.env.TCP_HOST || '0.0.0.0',
      ipfsPath: props.ipfsPath || process.env.IPFS_PATH || path.join(os.homedir(), '.jsipfs'),
      ipfsLocalPathPrefix: props.ipfsLocalPathPrefix || process.env.IPFS_LOCAL_PREFIX,
      ipfsCreateIfMissing: ipfsCreateIfMissing,
      ipfsBackendRoot:
        props.ipfsBackendRoot ?? StorageBackend.fromEnv(process.env.IPFS_BACKEND_ROOT),
      ipfsBackendBlocks:
        props.ipfsBackendBlocks ?? StorageBackend.fromEnv(process.env.IPFS_BACKEND_BLOCKS),
      ipfsBackendKeys:
        props.ipfsBackendKeys ?? StorageBackend.fromEnv(process.env.IPFS_BACKEND_KEYS),
      ipfsBackendPins:
        props.ipfsBackendPins ?? StorageBackend.fromEnv(process.env.IPFS_BACKEND_PINS),
      ipfsBackendDatastore:
        props.ipfsBackendDatastore ?? StorageBackend.fromEnv(process.env.IPFS_BACKEND_DATASTORE),

      awsBucketName: props.awsBucketName || process.env.AWS_BUCKET_NAME,
      awsAccessKeyId: props.awsBucketName || process.env.AWS_ACCESS_KEY_ID,
      awsSecretAccessKey: props.awsSecretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,

      announceAddressList:
        props.announceAddressList ?? (process.env.ANNOUNCE_ADDRESS_LIST?.split(',') || []),
      ipfsSwarmTcpPort: props.ipfsSwarmTcpPort || Number(process.env.IPFS_SWARM_TCP_PORT) || 4011,
      ipfsSwarmWsPort: props.ipfsSwarmWsPort || Number(process.env.IPFS_SWARM_WS_PORT) || 4012,

      ipfsEnableApi: props.ipfsEnableApi || fromBooleanInput(process.env.IPFS_ENABLE_API, true),
      ipfsApiPort: props.ipfsApiPort || Number(process.env.IPFS_API_PORT) || 5011,

      ipfsEnableGateway:
        props.ipfsEnableGateway ?? fromBooleanInput(process.env.IPFS_ENABLE_GATEWAY, false),
      ipfsGatewayPort: props.ipfsGatewayPort || Number(process.env.IPFS_GATEWAY_PORT) || 9011,
      ipfsDhtServerMode:
        props.ipfsDhtServerMode ?? fromBooleanInput(process.env.IPFS_DHT_SERVER_MODE, false),

      ipfsEnablePubsub:
        props.ipfsEnablePubsub ?? fromBooleanInput(process.env.IPFS_ENABLE_PUBSUB, true),
      ipfsPubsubTopics:
        props.ipfsPubsubTopics ??
        (process.env.IPFS_PUBSUB_TOPICS ? process.env.IPFS_PUBSUB_TOPICS.split(' ') : []),

      ipfsBootstrap: ipfsBootstrap,
      ceramicNetwork: ceramicNetwork,
      useCentralizedPeerDiscovery: useCentralizedPeerDiscovery,
      healthcheckEnabled:
        props.healthcheckEnabled ?? fromBooleanInput(process.env.HEALTHCHECK_ENABLED, false),
      healthcheckPort:
        props.healthcheckPort ||
        (process.env.HEALTHCHECK_PORT != null ? parseInt(process.env.HEALTHCHECK_PORT) : 8011),
      logger: props.logger ?? new DiagnosticsLogger(LogLevel.important, false),
    }

    const repo = createRepo(
      {
        path: configuration.ipfsPath,
        localPathPrefix: configuration.ipfsLocalPathPrefix,
        createIfMissing: configuration.ipfsCreateIfMissing,
        backends: {
          root: configuration.ipfsBackendRoot,
          blocks: configuration.ipfsBackendBlocks,
          keys: configuration.ipfsBackendKeys,
          pins: configuration.ipfsBackendPins,
          datastore: configuration.ipfsBackendDatastore,
        },
      },
      {
        bucket: configuration.awsBucketName,
        accessKeyId: configuration.awsAccessKeyId,
        secretAccessKey: configuration.awsSecretAccessKey,
      }
    )

    const ipfs = await createIPFS(
      {
        start: false,
        repo,
        ipld: { codecs: [dagJose] },
        libp2p: {
          config: {
            dht: {
              enabled: false,
              clientMode: !configuration.ipfsDhtServerMode,
            },
            pubsub: {
              enabled: configuration.ipfsEnablePubsub,
            },
          },
          addresses: {
            announce: configuration.announceAddressList,
          },
        },
        preload: {
          enabled: false,
        },
        config: {
          Addresses: {
            Swarm: [
              `/ip4/${configuration.tcpHost}/tcp/${configuration.ipfsSwarmTcpPort}`,
              `/ip4/${configuration.tcpHost}/tcp/${configuration.ipfsSwarmWsPort}/ws`,
            ],
            ...(configuration.ipfsEnableApi && {
              API: `/ip4/${configuration.tcpHost}/tcp/${configuration.ipfsApiPort}`,
            }),
            ...(configuration.ipfsEnableGateway && {
              Gateway: `/ip4/${configuration.tcpHost}/tcp/${configuration.ipfsGatewayPort}`,
            }),
            Announce: configuration.announceAddressList,
          },
          API: {
            HTTPHeaders: {
              'Access-Control-Allow-Origin': ['*'],
              'Access-Control-Allow-Methods': ['GET', 'POST'],
              'Access-Control-Allow-Headers': ['Authorization'],
              'Access-Control-Expose-Headers': ['Location'],
              'Access-Control-Allow-Credentials': ['true'],
            },
          },
          Routing: {
            Type: configuration.ipfsDhtServerMode ? 'dhtserver' : 'dhtclient',
          },
          Bootstrap: configuration.ipfsBootstrap,
        },
      },
      false
    )

    const api = configuration.ipfsEnableApi ? new HttpApi(ipfs) : undefined
    const gateway = configuration.ipfsEnableGateway ? new HttpGateway(ipfs) : undefined
    const topology = configuration.useCentralizedPeerDiscovery
      ? new IpfsTopology(ipfs, configuration.ceramicNetwork, configuration.logger)
      : undefined
    const healthcheck = configuration.healthcheckEnabled
      ? new HealthcheckServer(
          ipfs,
          configuration.healthcheckPort,
          configuration.tcpHost,
          configuration.logger
        )
      : undefined
    return new IpfsDaemon(configuration, ipfs, api, gateway, topology, healthcheck)
  }

  async start(): Promise<IpfsDaemon> {
    await this.ipfs.start()

    if (this.api) {
      await this.api.start()
      this.configuration.logger.imp(
        'IPFS API server listening on ' + this.configuration.ipfsApiPort
      )
    }

    if (this.gateway) {
      await this.gateway.start()
      this.configuration.logger.imp(
        'IPFS Gateway server listening on ' + this.configuration.ipfsGatewayPort
      )
    }

    await this.topology?.start()
    this.healthcheck?.start()

    await Promise.all(
      this.configuration.ipfsPubsubTopics.map((topic) => {
        return this.ipfs.pubsub.subscribe(topic, () => {
          // Do Nothing
        })
      })
    )
    return this
  }

  async stop(): Promise<void> {
    this.topology?.stop()
    await this.api?.stop()
    await this.gateway?.stop()
    await this.ipfs.stop()
  }
}
