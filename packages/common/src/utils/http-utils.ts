import fetch from 'cross-fetch'
// TODO: remove with esm upgrade
import AbortController from 'abort-controller'

interface FetchOpts {
  body?: any
  method?: string
  headers?: any
  timeout?: number
}

export async function fetchJson(url: string, opts: FetchOpts = {}): Promise<any> {
  if (opts.body) {
    Object.assign(opts, {
      body: JSON.stringify(opts.body),
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const timeoutLength = opts.timeout || 60000
  const controller = new AbortController()
  const timeout = setTimeout(() => {
    controller.abort()
  }, timeoutLength)
  Object.assign(opts, {
    signal: controller.signal,
  })

  const res = await fetch(url, opts)
    .catch((err) => {
      if (err.name == 'AbortError') {
        throw new Error(`Http request timed out after ${timeoutLength} ms`)
      }
      throw err
    })
    .finally(() => timeout && clearTimeout(timeout))

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP request to '${url}' failed with status '${res.statusText}': ${text}`)
  }

  return res.json()
}
