import express from 'express';
export class HealthcheckServer {
    constructor(ipfs, port, host, logger) {
        this.ipfs = ipfs;
        this.port = port;
        this.host = host;
        this.logger = logger;
    }
    start() {
        const app = express();
        app.get('/', async (req, res) => {
            if (!this.ipfs.isOnline()) {
                const message = 'Service offline';
                this.logger.err(message);
                return res.status(503).send(message);
            }
            return res.status(200).send('Alive');
        });
        app.listen(this.port, this.host, () => {
            this.logger.imp(`Healthcheck server is listening on ${this.port}`);
        });
    }
}
//# sourceMappingURL=healthcheck-server.js.map