import express from "express"

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import type { IPFSAPI as IpfsApi } from 'ipfs-core/dist/src/components'
import { DiagnosticsLogger } from '@ceramicnetwork/common'
export type IpfsApi = typeof IpfsApi

export class HealthcheckServer {
    constructor(readonly ipfs: IpfsApi, readonly port: number, readonly host: string, readonly logger: DiagnosticsLogger) {
    }


    start() {
        const app = express()

        app.get('/', async (req, res) => {
            if (!this.ipfs.isOnline()) {
                const message = "Service offline"
                this.logger.err(message)
                return res.status(503).send(message)
            }
            return res.status(200).send("Alive")
        })

        app.listen(this.port, this.host, () => {
            this.logger.imp(`Healthcheck server is listening on ${this.port}`)
        })
    }
}
