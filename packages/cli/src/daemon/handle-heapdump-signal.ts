import { writeHeapSnapshot } from 'node:v8'
import type { DiagnosticsLogger } from '@ceramicnetwork/common'

/**
 * Return +timestamp+ formatted as ISO8601 string. No milliseconds.
 * If not provided, +timestamp+ is `new Date()`, i.e. _now_.
 */
function timestamp(timestamp: Date = new Date()): string {
  return timestamp.toISOString().replace(/\.\d+/, '')
}

/**
 * Write heapdump to a file `ceramic-<timestamp>.heapsnapshot` in +folder+ on `SIGUSR2` signal.
 * It takes time to make a heapdump. We log when the heapdumping starts and finishes in `${folder}/heapdump-progress` file.
 *
 * @param folder Folder that contains a heapdump.
 * @param logger Used to annouce the heapdump events: when it is started and finished.
 */
export function handleHeapdumpSignal(folder: URL, logger: DiagnosticsLogger): void {
  process.on('SIGUSR2', () => {
    const filepath = new URL(`./ceramic-${timestamp()}.heapsnapshot`, folder)
    logger.write(`heapdump started: ${filepath.pathname}`)
    writeHeapSnapshot(filepath.pathname)
    logger.write(`heapdump finished: ${filepath.pathname}`)
  })
}
