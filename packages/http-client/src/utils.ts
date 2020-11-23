import fetch from "cross-fetch"
import DocID from "@ceramicnetwork/docid"

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
    const res = await (await fetch(url, opts)).json()
    if (res.error) throw new Error(res.error)
    return res
}

export function typeDocID(docId: DocID | string): DocID  {
    return (typeof docId === 'string') ? DocID.fromString(docId) : docId
}

export function combineURLs(baseURL, relativeURL) {
    return relativeURL
        ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
        : baseURL;
}

export async function delay(mills: number): Promise<void> {
    await new Promise(resolve => setTimeout(() => resolve(), mills))
}
