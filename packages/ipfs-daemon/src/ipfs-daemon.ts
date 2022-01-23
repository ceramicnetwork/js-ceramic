import { createController } from './create-ipfs'
import * as dagJose from 'dag-jose'
import { IpfsTopology } from '@ceramicnetwork/ipfs-topology'
import { DiagnosticsLogger, LogLevel } from '@ceramicnetwork/common'
import { HealthcheckServer } from './healthcheck-server'
import path from 'path'
import os from 'os'
import * as Ctl from 'ipfsd-ctl'

export interface Configuration {
  tcpHost: string
  ipfsPath: string
  announceAddressList: string[]
  ipfsCreateIfMissing: boolean
  ipfsSwarmTcpPort: number
  ipfsSwarmWsPort: number
  ipfsApiPort: number
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
  topology?: IpfsTopology
  healthcheck?: HealthcheckServer

  constructor(readonly configuration: Configuration, readonly ipfsd: Ctl.Controller) {}

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
      ipfsPath: props.ipfsPath || process.env.IPFS_PATH || path.join(os.homedir(), '.goipfs'),
      ipfsCreateIfMissing: ipfsCreateIfMissing,

      announceAddressList:
        props.announceAddressList ?? (process.env.ANNOUNCE_ADDRESS_LIST?.split(',') || []),
      ipfsSwarmTcpPort: props.ipfsSwarmTcpPort || Number(process.env.IPFS_SWARM_TCP_PORT) || 4011,
      ipfsSwarmWsPort: props.ipfsSwarmWsPort || Number(process.env.IPFS_SWARM_WS_PORT) || 4012,

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

    const ipfsd = await createController(
      {
        start: false,
        init: {
          allowNew: configuration.ipfsCreateIfMissing,
        },
        repo: configuration.ipfsPath,
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
            API: `/ip4/${configuration.tcpHost}/tcp/${configuration.ipfsApiPort}`,
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

    return new IpfsDaemon(configuration, ipfsd)
  }

  async start(): Promise<IpfsDaemon> {
    await this.ipfsd.start()

    this.configuration.logger.imp('IPFS API server listening on ' + this.configuration.ipfsApiPort)

    if (this.configuration.ipfsEnableGateway) {
      this.configuration.logger.imp(
        'IPFS Gateway server listening on ' + this.configuration.ipfsGatewayPort
      )
    }

    if (this.configuration.useCentralizedPeerDiscovery) {
      this.topology = new IpfsTopology(
        this.ipfsd.api,
        this.configuration.ceramicNetwork,
        this.configuration.logger
      )
      await this.topology.start()
    }

    if (this.configuration.healthcheckEnabled) {
      this.healthcheck = new HealthcheckServer(
        this.ipfsd.api,
        this.configuration.healthcheckPort,
        this.configuration.tcpHost,
        this.configuration.logger
      )
      await this.healthcheck.start()
    }

    await Promise.all(
      this.configuration.ipfsPubsubTopics.map((topic) => {
        return this.ipfsd.api.pubsub.subscribe(topic, () => {
          // Do Nothing
        })
      })
    )
    return this
  }

  async stop(): Promise<void> {
    this.topology?.stop()
    await this.ipfsd.stop()
  }
}
