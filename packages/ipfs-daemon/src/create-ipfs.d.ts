import * as Ctl from 'ipfsd-ctl';
import type { Options } from 'ipfs-core';
import type { IpfsApi } from '@ceramicnetwork/common';
export declare function createController(ipfsOptions: Options, disposable?: boolean): Promise<Ctl.Controller>;
export declare function createIPFS(overrideConfig?: Partial<Options>, disposable?: boolean): Promise<IpfsApi>;
export declare function swarmConnect(a: IpfsApi, b: IpfsApi): Promise<void>;
export declare function withFleet(n: number, task: (instances: IpfsApi[]) => Promise<void>): Promise<void>;
//# sourceMappingURL=create-ipfs.d.ts.map