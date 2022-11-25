import { CeramicDaemon } from '../ceramic-daemon.js'

export function handleSigintSignal(daemon: CeramicDaemon) {
  let shutdownInProgress: Promise<void> | undefined
  process.on('SIGINT', () => {
    if (shutdownInProgress) {
      // If multiple signals received while shutting down
      process.stdout.write('Shutting down...\n')
    } else {
      shutdownInProgress = daemon
        .close()
        .then(() => {
          process.exit(0)
        })
        .catch((error) => {
          console.error(error)
          process.exit(1)
        })
    }
  })
}
