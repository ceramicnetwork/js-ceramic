import {Pinning} from "./pinning";
import {Context} from "@ceramicnetwork/ceramic-common";
import {createPow, ffsOptions, ffsTypes} from "@textile/powergate-client"
import CID from 'cids'

export class EmptyTokenError extends Error {
    constructor(address: string) {
        super(`No token provided for Powergate at ${address}`);
    }
}

export enum JobStatus {
    JOB_STATUS_UNSPECIFIED =0,
    JOB_STATUS_QUEUED= 1,
    JOB_STATUS_EXECUTING= 2,
    JOB_STATUS_FAILED= 3,
    JOB_STATUS_CANCELED= 4,
    JOB_STATUS_SUCCESS= 5
}

export class PowergatePinning implements Pinning {
    static designator = 'powergate'

    readonly endpoint: string
    readonly token: string

    #pow: any // Till types in @textile/powergate-client are fixed

    constructor(connectionString: string, context: Context) {
        const url = new URL(connectionString)
        const hostname = url.hostname
        const port = parseInt(url.port, 10) || 5002
        const token = url.searchParams.get('token')
        const protocol = url.protocol
            .replace('powergate:', 'http')
            .replace('powergate+http:', 'http')
            .replace('powergate+https:', 'https')
        this.endpoint = `${protocol}://${hostname}:${port}`
        if (!token) {
            throw new EmptyTokenError(this.endpoint)
        }
        this.token = token
    }

    get pow() {
        return this.#pow
    }

    async open(): Promise<void> {
        this.#pow = createPow({host: this.endpoint})
        this.#pow.setToken(this.token)
    }

    async close(): Promise<void> {
        // Do Nothing
    }

    async pin(cid: CID): Promise<void> {
        try {
            const defaultConfig = await this.#pow.ffs.defaultStorageConfig()
            await this.#pow.ffs.pushStorageConfig(cid.toString(), ffsOptions.withStorageConfig(defaultConfig))
        } catch (e) {
            if (e.message.includes('cid already pinned, consider using override flag')) {
                // Do Nothing
            } else {
                throw e
            }
        }
    }

    async unpin(cid: CID): Promise<void> {
        const { config } = await this.#pow.ffs.getStorageConfig(cid.toString())
        const next = Object.assign({}, config, {
            config: {
                ...config,
                repairable: false,
                hot: {
                    ...config.hot,
                    allowUnfreeze: false,
                    enabled: false
                },
                cold: {
                    ...config.cold,
                    enabled: false
                }
            }
        })
        const opts = [ffsOptions.withOverride(true), ffsOptions.withStorageConfig(next)]
        const {jobId} = await this.#pow.ffs.pushStorageConfig(cid.toString(), ...opts)
        await this.waitForJobStatus(jobId, JobStatus.JOB_STATUS_SUCCESS)
        await this.#pow.ffs.remove(cid.toString())
    }

    protected waitForJobStatus(jobId: string, status: ffsTypes.JobStatusMap[keyof ffsTypes.JobStatusMap]): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const cancel = this.#pow.ffs.watchJobs((job: any) => {
                if (job.errCause && job.errCause.length > 0) {
                    reject(new Error(job.errCause))
                }
                if (job.status === JobStatus.JOB_STATUS_CANCELED) {
                    reject(new Error("job canceled"))
                }
                if (job.status === JobStatus.JOB_STATUS_FAILED) {
                    reject(new Error("job failed"))
                }
                if (job.status === status) {
                    cancel()
                    resolve()
                }
            }, jobId)
        })
    }
}