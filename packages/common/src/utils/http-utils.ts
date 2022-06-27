import { mergeAbortSignals, TimedAbortSignal } from './abort-signal-utils.js'

const DEFAULT_FETCH_TIMEOUT = 60 * 1000 * 3 // 3 minutes
interface FetchOpts {
  body?: any
  method?: string
  headers?: any
  timeout?: number
  signal?: AbortSignal
}

export async function fetchJson(url: URL | string, opts: FetchOpts = {}): Promise<any> {
  if (opts.body) {
    Object.assign(opts, {
      body: JSON.stringify(opts.body),
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const timeoutLength = opts.timeout || DEFAULT_FETCH_TIMEOUT
  const timedAbortSignal = new TimedAbortSignal(timeoutLength)

  opts.signal = opts.signal
    ? mergeAbortSignals([opts.signal, timedAbortSignal.signal])
    : timedAbortSignal.signal

  const res = await fetch(String(url), opts).finally(() => timedAbortSignal.clear())

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP request to '${url}' failed with status '${res.statusText}': ${text}`)
  }

  return res.json()
}
