import { IpfsTopology } from '@ceramicnetwork/ipfs-topology';
import { DiagnosticsLogger } from '@ceramicnetwork/common';
import { HealthcheckServer } from './healthcheck-server.js';
import * as Ctl from 'ipfsd-ctl';
export interface Configuration {
    tcpHost: string;
    ipfsPath: string;
    announceAddressList: string[];
    ipfsCreateIfMissing: boolean;
    ipfsSwarmTcpPort: number;
    ipfsSwarmWsPort: number;
    ipfsApiPort: number;
    ipfsGatewayPort: number;
    ipfsEnableGateway: boolean;
    ipfsDhtServerMode: boolean;
    ipfsEnablePubsub: boolean;
    ipfsPubsubTopics: string[];
    ipfsBootstrap: string[];
    ceramicNetwork: string;
    useCentralizedPeerDiscovery: boolean;
    healthcheckEnabled: boolean;
    healthcheckPort: number;
    logger: DiagnosticsLogger;
}
export declare function fromBooleanInput(input: string | undefined, byDefault?: boolean): boolean;
export declare class IpfsDaemon {
    readonly configuration: Configuration;
    readonly ipfsd: Ctl.Controller;
    topology?: IpfsTopology;
    healthcheck?: HealthcheckServer;
    constructor(configuration: Configuration, ipfsd: Ctl.Controller);
    static create(props?: Partial<Configuration>): Promise<IpfsDaemon>;
    start(): Promise<IpfsDaemon>;
    stop(): Promise<void>;
}
//# sourceMappingURL=ipfs-daemon.d.ts.map