import {createRepo} from 'datastore-s3'
import IPFS from 'ipfs'
import HttpApi from 'ipfs-http-server'
import HttpGateway from 'ipfs-http-gateway'
import dagJose from "dag-jose";
import {IpfsTopology} from "@ceramicnetwork/ipfs-topology";
import { DiagnosticsLogger, LogLevel, IpfsApi } from "@ceramicnetwork/common";
import { sha256 } from 'multiformats/hashes/sha2'
import legacy from 'multiformats/legacy'
import { HealthcheckServer } from "./healthcheck-server";

const hasher = {}
hasher[sha256.code] = sha256
const format = legacy(dagJose, {hashes: hasher})

export interface Configuration {
    tcpHost: string
    ipfsPath: string
    ipfsS3RepoEnabled: boolean
    awsBucketName?: string
    awsAccessKeyId?: string
    awsSecretAccessKey?: string
    announceAddressList: string[]
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

export class IpfsDaemon {
    constructor(readonly configuration: Configuration, readonly ipfs: IpfsApi, readonly api?: HttpApi, readonly gateway?: HttpGateway, readonly topology?: IpfsTopology, readonly healthcheck?: HealthcheckServer) {
    }

    static async create(props: Partial<Configuration> = {}): Promise<IpfsDaemon> {
        const ceramicNetwork = props.ceramicNetwork || process.env.CERAMIC_NETWORK
        const useCentralizedPeerDiscovery = props.useCentralizedPeerDiscovery ?? process.env.NODE_ENV != 'test'
        const ipfsBootstrap = props.ipfsBootstrap || (process.env.IPFS_BOOTSTRAP ? process.env.IPFS_BOOTSTRAP.split(' ') : [])

        const configuration: Configuration = {
            tcpHost: props.tcpHost || process.env.TCP_HOST || '0.0.0.0',
            ipfsPath: props.ipfsPath || process.env.IPFS_PATH || 'ipfs',
            ipfsS3RepoEnabled: props.ipfsS3RepoEnabled ?? process.env.IPFS_S3_REPO_ENABLED === 'true',

            awsBucketName: props.awsBucketName || process.env.AWS_BUCKET_NAME,
            awsAccessKeyId: props.awsBucketName || process.env.AWS_ACCESS_KEY_ID,
            awsSecretAccessKey: props.awsSecretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,

            announceAddressList: props.announceAddressList ?? (process.env.ANNOUNCE_ADDRESS_LIST?.split(',') || []),
            ipfsSwarmTcpPort: props.ipfsSwarmTcpPort || Number(process.env.IPFS_SWARM_TCP_PORT) || 4011,
            ipfsSwarmWsPort: props.ipfsSwarmWsPort || Number(process.env.IPFS_SWARM_WS_PORT) || 4012,

            ipfsEnableApi: props.ipfsEnableApi || (process.env.IPFS_ENABLE_API ? process.env.IPFS_ENABLE_API === 'true' : true),
            ipfsApiPort: props.ipfsApiPort || Number(process.env.IPFS_API_PORT) || 5011,

            ipfsEnableGateway: props.ipfsEnableGateway ?? (process.env.IPFS_ENABLE_GATEWAY ? process.env.IPFS_ENABLE_GATEWAY === 'true' : true),
            ipfsGatewayPort: props.ipfsGatewayPort || Number(process.env.IPFS_GATEWAY_PORT) || 9011,
            ipfsDhtServerMode: props.ipfsDhtServerMode ?? (process.env.IPFS_DHT_SERVER_MODE === 'true'),

            ipfsEnablePubsub: props.ipfsEnablePubsub ?? (process.env.IPFS_ENABLE_PUBSUB ? process.env.IPFS_ENABLE_PUBSUB === 'true' : true),
            ipfsPubsubTopics: props.ipfsPubsubTopics ?? (process.env.IPFS_PUBSUB_TOPICS ? process.env.IPFS_PUBSUB_TOPICS.split(' ') : []),

            ipfsBootstrap: ipfsBootstrap,
            ceramicNetwork: ceramicNetwork,
            useCentralizedPeerDiscovery: useCentralizedPeerDiscovery,
            healthcheckEnabled: props.healthcheckEnabled ?? (process.env.HEALTHCHECK_ENABLED === 'true'),
            healthcheckPort: props.healthcheckPort || (process.env.HEALTHCHECK_PORT != null ? parseInt(process.env.HEALTHCHECK_PORT) : 8011),
            logger: props.logger ?? new DiagnosticsLogger(LogLevel.important, false),
        }

        const repo = configuration.ipfsS3RepoEnabled ? createRepo({
            path: configuration.ipfsPath,
        }, {
            bucket: configuration.awsBucketName,
            accessKeyId: configuration.awsAccessKeyId,
            secretAccessKey: configuration.awsSecretAccessKey,
        }) : configuration.ipfsPath

        const ipfs = await IPFS.create({
            start: false,
            repo,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            ipld: {formats: [format]},
            libp2p: {
                config: {
                    dht: {
                        enabled: false,
                        clientMode: !configuration.ipfsDhtServerMode,
                        randomWalk: false,
                    },
                    pubsub: {
                        enabled: configuration.ipfsEnablePubsub,
                    },
                },
                addresses: {
                    announce: configuration.announceAddressList,
                }
            },
            preload: {
                enabled: false
            },
            config: {
                Addresses: {
                    Swarm: [
                        `/ip4/${configuration.tcpHost}/tcp/${configuration.ipfsSwarmTcpPort}`,
                        `/ip4/${configuration.tcpHost}/tcp/${configuration.ipfsSwarmWsPort}/ws`,
                    ],
                    ...configuration.ipfsEnableApi && {API: `/ip4/${configuration.tcpHost}/tcp/${configuration.ipfsApiPort}`},
                    ...configuration.ipfsEnableGateway && {Gateway: `/ip4/${configuration.tcpHost}/tcp/${configuration.ipfsGatewayPort}`}
                    ,
                },
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                API: {
                    HTTPHeaders: {
                        "Access-Control-Allow-Origin": [
                            "*"
                        ],
                        "Access-Control-Allow-Methods": [
                            "GET",
                            "POST"
                        ],
                        "Access-Control-Allow-Headers": [
                            "Authorization"
                        ],
                        "Access-Control-Expose-Headers": [
                            "Location"
                        ],
                        "Access-Control-Allow-Credentials": [
                            "true"
                        ]
                    }
                },
                Routing: {
                    Type: configuration.ipfsDhtServerMode ? 'dhtserver' : 'dhtclient',
                },
                Bootstrap: configuration.ipfsBootstrap
            },
        })

        const api = configuration.ipfsEnableApi ? new HttpApi(ipfs) : undefined
        const gateway = configuration.ipfsEnableGateway ? new HttpGateway(ipfs) : undefined
        const topology = configuration.useCentralizedPeerDiscovery ? new IpfsTopology(ipfs, configuration.ceramicNetwork, configuration.logger) : undefined
        const healthcheck = configuration.healthcheckEnabled ? new HealthcheckServer(ipfs, configuration.healthcheckPort, configuration.tcpHost, configuration.logger) : undefined
        return new IpfsDaemon(configuration, ipfs, api, gateway, topology, healthcheck)
    }

    async start(): Promise<IpfsDaemon> {
        await this.ipfs.start()

        if (this.api) {
            await this.api.start()
            this.configuration.logger.imp('IPFS API server listening on ' + this.configuration.ipfsApiPort)
        }

        if (this.gateway) {
            await this.gateway.start()
            this.configuration.logger.imp('IPFS Gateway server listening on ' + this.configuration.ipfsGatewayPort)
        }

        await this.topology?.start()
        this.healthcheck?.start()

        await Promise.all(this.configuration.ipfsPubsubTopics.map((topic) => {
            return this.ipfs.pubsub.subscribe(topic, () => {
                // Do Nothing
            })
        }))
        return this
    }

    async stop(): Promise<void> {
        this.topology?.stop()
        await this.api?.stop()
        await this.gateway?.stop()
        await this.ipfs.stop()
    }
}
