import fetch from "cross-fetch"

interface FetchOpts {
    body?: any
    method?: string
    headers?: any
}

export async function fetchJson(url: string, opts: FetchOpts = {}): Promise<any> {
    if (opts.body) {
        Object.assign(opts, {
            body: JSON.stringify(opts.body),
            headers: { 'Content-Type': 'application/json' }
        })
    }
    const res = await fetch(url, opts)
    if (!res.ok) {
        const text = await res.text()
        throw new Error(`HTTP request to '${url}' failed with status '${res.statusText}': ${text}`)
    }

    return res.json()
}
