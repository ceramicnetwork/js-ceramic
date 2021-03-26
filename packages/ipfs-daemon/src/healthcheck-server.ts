import os from 'os-utils'
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

            const maxHealthyCpu = 0.95
            const maxHealthyMemory = 0.80

            const freeCpu: any = await new Promise((resolve) => os.cpuFree(resolve))
            const cpuUsage: number = 1 - freeCpu

            const freeMemory = os.freememPercentage()
            const memUsage: number = 1 - freeMemory

            if (cpuUsage > maxHealthyCpu || memUsage > maxHealthyMemory) {
                const stats = `cpuUsage=${cpuUsage} maxHealthyCpu=${maxHealthyCpu} freeCpu=${freeCpu} memoryUsage=${memUsage} maxHealthyMemory=${maxHealthyMemory} freeMemory=${freeMemory}`
                this.logger.err(stats)
                return res.status(503).send("Insufficient resources")
            }
            return res.status(200).send("Alive")
        })

        app.listen(this.port, this.host, () => {
            this.logger.imp(`Healthcheck server is listening on ${this.port}`)
        })
    }
}
