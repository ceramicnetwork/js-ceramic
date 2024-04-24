import type { Response } from 'express'

// Not an error really.
// A way to tell that a stream is over.
export class ExpectedCloseError extends Error {}

export class SSESink<T> implements UnderlyingSink<T> {
  constructor(
    private readonly res: Response,
    private readonly stringify: (value: T) => string = JSON.stringify
  ) {}

  start(controller: WritableStreamDefaultController) {
    this.res.writeHead(200, {
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache',
      'Content-Type': 'text/event-stream',
    })
    this.res.once('error', controller.error.bind(controller))
    this.res.once('close', () => {
      this.close()
      controller.error(new ExpectedCloseError())
    })
    this.res.once('abort', () => {
      this.abort()
      controller.error(new ExpectedCloseError())
    })
  }

  async write(element: T) {
    const canWriteMore = this.res.write(`data: ${this.stringify(element)}\n\n`)
    if (!canWriteMore) {
      // Wait until data are drained
      await new Promise((resolve) => {
        this.res.once('drain', resolve)
      })
    }
  }

  abort() {
    this.res.end()
  }

  close() {
    this.res.end()
  }
}
