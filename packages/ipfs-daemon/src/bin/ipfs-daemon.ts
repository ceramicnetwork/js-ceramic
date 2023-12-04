#!/usr/bin/env node

import { IpfsDaemon } from '../ipfs-daemon.js'
import { LoggerProvider } from '@ceramicnetwork/common'

const logger = new LoggerProvider().getDiagnosticsLogger()

process.on('uncaughtException', (err) => {
  logger.err(err)
})

IpfsDaemon.create()
  .then((ipfs) => ipfs.start())
  .catch((e) => logger.err(e))
