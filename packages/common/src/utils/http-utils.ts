import fetch from 'cross-fetch'
import { mergeAbortSignals, TimedAbortSignal, abortable } from './abort-signal-utils.js'

const DEFAULT_FETCH_TIMEOUT = 60 * 1000 * 3 // 3 minutes

export type FetchOpts = Partial<{
  body: any
  method: HttpMethod
  headers: any
  timeout: number
  signal: AbortSignal
}>

export type FetchRequestParams = {
  url: URL | string
  opts?: FetchOpts
}

export type FetchRequest = (url: URL | string, opts?: FetchOpts) => Promise<any>

export type RFC9110Methods =
  | 'GET'
  | 'HEAD'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'CONNECT'
  | 'OPTIONS'
  | 'TRACE'
export type HttpMethod = RFC9110Methods | Lowercase<RFC9110Methods>

export async function fetchJson(url: URL | string, opts: Partial<FetchOpts> = {}): Promise<any> {
  if (opts.body) {
    const headers = { 'Content-Type': 'application/json', ...opts.headers }

    Object.assign(opts, {
      body: headers['Content-Type'] == 'application/json' ? JSON.stringify(opts.body) : opts.body,
      headers: headers,
    })
  }

  const timeoutLength = opts.timeout || DEFAULT_FETCH_TIMEOUT
  const timedAbortSignal = new TimedAbortSignal(timeoutLength)

  const signal = opts.signal
    ? mergeAbortSignals([opts.signal, timedAbortSignal.signal])
    : timedAbortSignal.signal

  const res = await abortable(signal, (abortSignal) => {
    return fetch(String(url), { ...opts, signal: abortSignal, credentials: 'include' })
  }).finally(() => timedAbortSignal.clear())

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP request to '${url}' failed with status '${res.statusText}': ${text}`)
  }

  return res.json()
}
