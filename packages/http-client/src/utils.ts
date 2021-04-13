import fetch from "cross-fetch"
import StreamID from "@ceramicnetwork/streamid"

interface FetchOpts {
  body?: any
  method?: string
}

export async function fetchJson(url: string, opts: FetchOpts = {}): Promise<any> {
    if (opts.body) {
        Object.assign(opts, {
            body: JSON.stringify(opts.body),
            headers: { 'Content-Type': 'application/json' }
        })
    }
    const res = await fetch(url, opts).then(response => response.json())
    if (res.error) {
        throw new Error(res.error)
    }
    return res
}

export function typeStreamID(streamId: StreamID | string): StreamID  {
    return (typeof streamId === 'string') ? StreamID.fromString(streamId) : streamId
}

export function combineURLs(baseURL, relativeURL) {
    return relativeURL
        ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
        : baseURL;
}

export async function delay(mills: number): Promise<void> {
    await new Promise<void>(resolve => setTimeout(() => resolve(), mills))
}
