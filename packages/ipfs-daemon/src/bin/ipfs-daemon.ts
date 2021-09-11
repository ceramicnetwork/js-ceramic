#!/usr/bin/env node

import { IpfsDaemon } from '../ipfs-daemon'

process.on('uncaughtException', (err) => {
  console.log(err) // just log for now
})

IpfsDaemon.create()
  .then((ipfs) => ipfs.start())
  .catch((e) => console.error(e))
