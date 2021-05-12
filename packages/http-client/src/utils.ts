import StreamID from "@ceramicnetwork/streamid"

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
