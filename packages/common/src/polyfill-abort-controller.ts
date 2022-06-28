import * as polyfill from 'abort-controller'

export function polyfillAbortController() {
  if (!globalThis.AbortController) {
    globalThis.AbortController = polyfill.AbortController
  }

  if (!globalThis.AbortSignal) {
    globalThis.AbortSignal = polyfill.AbortSignal
  }
}
