import { test, jest } from '@jest/globals'
import type { SpiedFunction } from 'jest-mock'
import type { Response } from 'express'
import { from, Observable } from 'rxjs'
import { SseFeed } from '../sse-feed.js'
import { EventEmitter } from 'node:events'
import { LoggerProvider } from '@ceramicnetwork/common'

const logger = new LoggerProvider().getDiagnosticsLogger()

class FauxResponse extends EventEmitter {
  readonly writeHead = jest.fn()
  readonly write = jest.fn()
  readonly end = jest.fn()
}

test('constructor does not subscribe to observable', () => {
  const observable = from([1, 2, 3])
  const subscribeSpy = jest.spyOn(observable, 'subscribe')
  new SseFeed(logger, observable, String)
  expect(subscribeSpy).not.toBeCalled()
})

test('send events', () => {
  const source = [10, 20, 30]
  const feed = new SseFeed(logger, from(source), String)
  const fauxResponse = new FauxResponse()
  feed.send(fauxResponse as unknown as Response)
  expect(fauxResponse.writeHead).toBeCalledWith(200, {
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
    'Content-Type': 'text/event-stream',
  })
  expect(fauxResponse.write).toBeCalledTimes(source.length)
  for (const [index, value] of source.entries()) {
    expect(fauxResponse.write).nthCalledWith(index + 1, `data: ${value}\n\n`)
  }
})

test('close connection when observable is done', () => {
  const source = [10, 20, 30]
  const feed = new SseFeed(logger, from(source), String)
  const fauxResponse = new FauxResponse()
  feed.send(fauxResponse as unknown as Response)
  expect(fauxResponse.write).toBeCalledTimes(source.length)
  expect(fauxResponse.end).toBeCalled()
})

test('stop subscription when connection closed', () => {
  const source = new Observable<number>((subscriber) => {
    let counter = 0
    const interval = setInterval(() => subscriber.next(counter++), 200)
    return () => clearInterval(interval)
  })
  const subscribeOriginal = source.subscribe.bind(source)
  let unsubscribeSpy: SpiedFunction
  const subscribeSpy = jest.spyOn(source, 'subscribe').mockImplementation((...args) => {
    const subscription = subscribeOriginal(...args)
    unsubscribeSpy = jest.spyOn(subscription, 'unsubscribe')
    return subscription
  })
  const feed = new SseFeed(logger, source, String)
  const fauxResponse = new FauxResponse()
  feed.send(fauxResponse as unknown as Response)
  expect(subscribeSpy).toBeCalledTimes(1)
  expect(unsubscribeSpy).toBeCalledTimes(0)
  fauxResponse.emit('close')
  expect(unsubscribeSpy).toBeCalledTimes(1)
  expect(fauxResponse.end).toBeCalled()
})

test('close connection on error', () => {
  const source = new Observable<number>((subscriber) => {
    subscriber.next(1)
    subscriber.next(2)
    subscriber.next(3)
    subscriber.error(new Error(`Oops`))
  })
  const errSpy = jest.spyOn(logger, 'err')
  const feed = new SseFeed(logger, source, String)
  const fauxResponse = new FauxResponse()
  feed.send(fauxResponse as unknown as Response)
  expect(fauxResponse.write).toBeCalledTimes(3)
  expect(fauxResponse.end).toBeCalledTimes(1)
  expect(errSpy).toBeCalledTimes(1)
})
