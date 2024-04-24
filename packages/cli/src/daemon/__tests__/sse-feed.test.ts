import { test, jest, expect } from '@jest/globals'
import type { Response } from 'express'
import { ExpectedCloseError, SSESink } from '../sse-feed.js'
import { EventEmitter } from 'node:events'
import { WritableStream } from 'node:stream/web'

class FauxResponse extends EventEmitter {
  readonly writeHead = jest.fn()
  readonly write = jest.fn(() => true)
  readonly end = jest.fn()
}

function readableStreamFromIterable<T>(source: Iterable<T>) {
  const iterator = source[Symbol.iterator]()
  return new ReadableStream({
    start(controller) {
      const next = iterator.next()
      if (next.done) {
        controller.close()
      } else {
        controller.enqueue(next.value)
      }
    },
    pull(controller) {
      const next = iterator.next()
      if (next.done) {
        controller.close()
      } else {
        controller.enqueue(next.value)
      }
    },
  })
}

test('send events 2', async () => {
  const source = [10, 20, 30]
  const readable = readableStreamFromIterable(source)
  const fauxResponse = new FauxResponse()
  const sink = new SSESink(fauxResponse as unknown as Response)
  const doneStreaming = readable.pipeTo(new WritableStream(sink))
  expect(fauxResponse.writeHead).toBeCalledWith(200, {
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
    'Content-Type': 'text/event-stream',
  })
  await doneStreaming
  expect(fauxResponse.write).toBeCalledTimes(source.length)
  for (const [index, value] of source.entries()) {
    expect(fauxResponse.write).nthCalledWith(index + 1, `data: ${value}\n\n`)
  }
})

test('close connection when source is done', async () => {
  const source = [10, 20, 30]
  const readable = readableStreamFromIterable(source)
  const fauxResponse = new FauxResponse()
  const sink = new SSESink(fauxResponse as unknown as Response)
  const doneStreaming = readable.pipeTo(new WritableStream(sink))
  await doneStreaming
  expect(fauxResponse.write).toBeCalledTimes(source.length)
  expect(fauxResponse.end).toBeCalled()
})

test('stop when connection closed', async () => {
  let counter = 0
  let interval: NodeJS.Timer | undefined = undefined
  const source = {
    start(controller) {
      interval = setInterval(() => {
        controller.enqueue(counter++)
      }, 200)
    },
    cancel() {
      clearInterval(interval)
    },
  }
  const startSpy = jest.spyOn(source, 'start')
  const cancelSpy = jest.spyOn(source, 'cancel')
  const readable = new ReadableStream(source)

  const fauxResponse = new FauxResponse()
  const sink = new SSESink(fauxResponse as unknown as Response)
  const doneStreaming = readable.pipeTo(new WritableStream(sink))
  expect(startSpy).toBeCalledTimes(1)
  expect(cancelSpy).toBeCalledTimes(0)
  fauxResponse.emit('close')
  await expect(doneStreaming).rejects.toThrow(ExpectedCloseError)
  expect(cancelSpy).toBeCalledTimes(1)
})

test('close connection on error', async () => {
  let counter = 0
  const readable = new ReadableStream({
    pull(controller) {
      if (counter > 2) {
        controller.error(new Error('Oops'))
        return
      }
      controller.enqueue(counter++)
    },
  })
  const fauxResponse = new FauxResponse()
  const sink = new SSESink(fauxResponse as unknown as Response)
  const doneStreaming = readable.pipeTo(new WritableStream(sink))
  await expect(doneStreaming).rejects.toThrow(/Oops/)
  expect(fauxResponse.write).toBeCalledTimes(3)
  expect(fauxResponse.end).toBeCalledTimes(1)
})
