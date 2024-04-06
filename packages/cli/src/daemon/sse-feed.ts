import type { Observable } from 'rxjs'
import type { Response } from 'express'
import type { DiagnosticsLogger } from '@ceramicnetwork/common'

export class SSESink<T> implements UnderlyingSink<T> {
  constructor(
    private readonly res: Response,
    private readonly stringify: (value: T) => string = JSON.stringify
  ) {
    this.close = this.close.bind(this)
  }

  start(controller: WritableStreamDefaultController) {
    this.res.writeHead(200, {
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache',
      'Content-Type': 'text/event-stream',
    })
    this.res.once('error', controller.error.bind(controller))
    this.res.once('close', this.close)
    this.res.once('abort', this.close)
  }

  async write(element: T) {
    const canWriteMore = this.res.write(`data: ${this.stringify(element)}\n\n`)
    if (!canWriteMore) {
      // Wait till data are drained
      await new Promise((resolve) => {
        this.res.once('drain', resolve)
      })
    }
  }

  close() {
    this.res.end()
  }
}

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
