import type { Observable } from 'rxjs'
import type { Response } from 'express'
import type { DiagnosticsLogger } from '@ceramicnetwork/common'

/**
 * Server-Sent Events (SSE) Feed.
 */
export class SseFeed<TInput> {
  constructor(
    private readonly logger: DiagnosticsLogger,
    private readonly observable: Observable<TInput>,
    private readonly serializeFn: (value: TInput) => string
  ) {}

  send(res: Response): void {
    res.writeHead(200, {
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache',
      'Content-Type': 'text/event-stream',
    })

    const subscription = this.observable.subscribe({
      next: (value) => {
        res.write(`data: ${this.serializeFn(value)}\n\n`)
      },
      error: (error) => {
        this.logger.err(error)
        res.end()
      },
      complete: () => {
        res.end()
      },
    })

    const tearDown = () => {
      subscription.unsubscribe()
      res.end()
      res.off('close', tearDown)
      res.off('abort', tearDown)
    }

    res.on('close', tearDown)
    res.on('abort', tearDown)
  }
}
