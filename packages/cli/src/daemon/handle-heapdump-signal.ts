import { writeHeapSnapshot } from 'node:v8'
import { appendFileSync } from 'node:fs'

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
 */
export function handleHeapdumpSignal(folder: URL): void {
  process.on('SIGUSR2', () => {
    const filepath = new URL(`./ceramic-${timestamp()}.heapsnapshot`, folder)
    const notifierFilepath = new URL(`./heapdumping-progress`, folder)
    const pid = process.pid
    appendFileSync(notifierFilepath, `${timestamp()}: ${pid}: started: ${filepath.pathname}\n`)
    writeHeapSnapshot(filepath.pathname)
    appendFileSync(notifierFilepath, `${timestamp()}: ${pid}: finished: ${filepath.pathname}\n`)
  })
}
