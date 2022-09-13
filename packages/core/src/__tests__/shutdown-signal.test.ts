import { ShutdownSignal } from '../shutdown-signal.js'

const fn = (abortSignal: AbortSignal) => {
  return new Promise<string>((resolve, reject) => {
    if (abortSignal.aborted) reject(new Error(`aborted before run`))
    abortSignal.addEventListener('abort', () => {
      reject(new Error(`aborted after run`))
    })
    new Promise((resolve1) => setTimeout(resolve1, 500)).then(() => resolve('ok'))
  })
}

test('abort on complete', async () => {
  const signal = new ShutdownSignal()
  const result = signal.abortable((abortSignal) => fn(abortSignal))
  signal.abort()
  await expect(result).rejects.toThrow(new Error(`aborted after run`))
  expect(signal.observers).toEqual([])
})

test('abort when completed', async () => {
  const signal = new ShutdownSignal()
  signal.abort()
  const result = signal.abortable((abortSignal) => fn(abortSignal))
  await expect(result).rejects.toThrow(new Error(`aborted before run`))
  expect(signal.observers).toEqual([])
})

test('run then abort', async () => {
  const signal = new ShutdownSignal()
  await expect(signal.abortable((abortSignal) => fn(abortSignal))).resolves.toEqual('ok')
  expect(signal.observers).toEqual([])
  signal.abort()
})
