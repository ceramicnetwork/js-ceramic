import CID from "cids";
import type {
    CidList,
    PinningBackend,
    PinningInfo,
} from "@ceramicnetwork/common";
import { createPow, Pow, ffsTypes } from "@textile/powergate-client";
import * as sha256 from "@stablelib/sha256";
import * as base64 from "@stablelib/base64";
import * as _ from "lodash";

export class EmptyTokenError extends Error {
    constructor(address: string) {
        super(`No token provided for Powergate at ${address}`);
    }
}

export enum JobStatus {
    JOB_STATUS_UNSPECIFIED = 0,
    JOB_STATUS_QUEUED = 1,
    JOB_STATUS_EXECUTING = 2,
    JOB_STATUS_FAILED = 3,
    JOB_STATUS_CANCELED = 4,
    JOB_STATUS_SUCCESS = 5,
}

const textEncoder = new TextEncoder();

export class PowergatePinningBackend implements PinningBackend {
    static designator = "powergate";

    readonly endpoint: string;
    readonly token: string;
    readonly id: string;

    #pow?: Pow;

    constructor(readonly connectionString: string,) {
        const url = new URL(connectionString);
        const hostname = url.hostname;
        const port = parseInt(url.port, 10) || 6002;
        const token = url.searchParams.get("token");
        const protocol = url.protocol
            .replace("powergate:", "http")
            .replace("powergate+http:", "http")
            .replace("powergate+https:", "https");
        this.endpoint = `${protocol}://${hostname}:${port}`;
        if (!token) {
            throw new EmptyTokenError(this.endpoint);
        }
        this.token = token;

        const bytes = textEncoder.encode(this.connectionString);
        const digest = base64.encodeURLSafe(sha256.hash(bytes));
        this.id = `${PowergatePinningBackend.designator}@${digest}`;
    }

    get pow(): Pow {
        return this.#pow;
    }

    open(): void {
        this.#pow = createPow({ host: this.endpoint });
        this.#pow.setToken(this.token);
    }

    async close(): Promise<void> {
        // Do Nothing
    }

    async pin(cid: CID): Promise<void> {
        if (this.#pow) {
            try {
                await this.#pow.ffs.pushStorageConfig(cid.toString(), {
                    override: true,
                });
            } catch (e) {
                if (e.message.includes("cid already pinned, consider using override flag")) {
                    // Do Nothing
                } else {
                    throw e;
                }
            }
        }
    }

    async unpin(cid: CID): Promise<void> {
        if (this.#pow) {
            const { config } = await this.#pow.ffs.getStorageConfig(cid.toString());
            if (config) {
                const next = Object.assign({}, config, {
                    ...config, repairable: false, hot: {
                        ...config.hot, allowUnfreeze: false, enabled: false,
                    }, cold: {
                        ...config.cold, enabled: false,
                    },
                });
                const { jobId } = await this.#pow.ffs.pushStorageConfig(cid.toString(), {
                    override: true, storageConfig: next,
                });
                await this.waitForJobStatus(jobId, JobStatus.JOB_STATUS_SUCCESS);
                await this.#pow.ffs.remove(cid.toString());
            }
        }
    }

    protected async waitForJobStatus(jobId: string, status: ffsTypes.JobStatusMap[keyof ffsTypes.JobStatusMap]): Promise<void> {
        if (this.#pow) {
            const pow = this.#pow;
            return new Promise<void>((resolve, reject) => {
                const cancel = pow.ffs.watchJobs((job: any) => {
                    if (job.errCause && job.errCause.length > 0) {
                        reject(new Error(job.errCause));
                    }
                    if (job.status === JobStatus.JOB_STATUS_CANCELED) {
                        reject(new Error("job canceled"));
                    }
                    if (job.status === JobStatus.JOB_STATUS_FAILED) {
                        reject(new Error("job failed"));
                    }
                    if (job.status === status) {
                        cancel();
                        resolve();
                    }
                }, jobId);
            });
        }
    }

    async ls(): Promise<CidList> {
        if (this.#pow) {
            const { info } = await this.#pow.ffs.info();
            if (info) {
                const cids = info.pinsList;
                const result: CidList = {};
                cids.forEach((cid) => {
                    result[cid] = [this.id];
                });
                return result;
            } else {
                return {};
            }
        } else {
            return {};
        }
    }

    async info(): Promise<PinningInfo> {
        let info: any = {};
        if (this.#pow) {
            const { info: ffsInfo } = await this.#pow.ffs.info();
            if (ffsInfo) {
                info = _.omit(ffsInfo, "pinsList");
            }
        }
        return {
            [this.id]: info,
        };
    }
}
