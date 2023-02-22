import type { DiagnosticsLogger, IpfsApi } from '@ceramicnetwork/common';
export declare class HealthcheckServer {
    readonly ipfs: IpfsApi;
    readonly port: number;
    readonly host: string;
    readonly logger: DiagnosticsLogger;
    constructor(ipfs: IpfsApi, port: number, host: string, logger: DiagnosticsLogger);
    start(): void;
}
//# sourceMappingURL=healthcheck-server.d.ts.map