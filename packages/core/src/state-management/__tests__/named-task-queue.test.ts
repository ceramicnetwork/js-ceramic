import { jest } from '@jest/globals'
import { NamedTaskQueue } from '../named-task-queue.js'
import { noop, TaskQueue } from '../../pubsub/task-queue.js'

const N = 10
const name = 'foo'
const names = ['foo', 'blah']

describe('run', () => {
  test('sequential tasks', async () => {
    const results = []
    const lanes = new Map<string, TaskQueue>()
    const queue = new NamedTaskQueue(noop, lanes)
    const times = Array.from({ length: N }).map((_, index) => index)
    await Promise.all(
      times.map((i) => {
        return queue.run(name, async () => {
          results.push(i)
        })
      })
    )
    expect(results).toEqual(times)
    expect(lanes.size).toEqual(0)
  })

  test('parallel queues', async () => {
    const results: Record<string, number[]> = {}
    const lanes = new Map<string, TaskQueue>()
    const queue = new NamedTaskQueue(noop, lanes)
    const times = Array.from({ length: N }).map((_, index) => index)

    const forName = (name: string) =>
      Promise.all(
        times.map((index) => {
          return queue.run(name, async () => {
            const found = results[name]
            if (found) {
              found.push(index)
            } else {
              results[name] = [index]
            }
          })
        })
      )

    await Promise.all(names.map((name) => forName(name)))
    names.forEach((name) => {
      expect(results[name]).toEqual(times)
    })
    expect(lanes.size).toEqual(0)
  })
})

describe('add', () => {
  test('sequential tasks', async () => {
    const results = []
    const lanes = new Map<string, TaskQueue>()
    const queue = new NamedTaskQueue(noop, lanes)
    const times = Array.from({ length: N }).map((_, index) => index)
    times.forEach((i) => {
      queue.add(name, async () => {
        results.push(i)
      })
    })
    await lanes.get(name).onIdle()
    expect(results).toEqual(times)
    expect(lanes.size).toEqual(0)
  })

  test('parallel queues', async () => {
    const results: Record<string, number[]> = {}
    const lanes = new Map<string, TaskQueue>()
    const queue = new NamedTaskQueue(noop, lanes)
    const times = Array.from({ length: N }).map((_, index) => index)

    names.forEach((name) => {
      times.map((index) => {
        queue.add(name, async () => {
          const found = results[name]
          if (found) {
            found.push(index)
          } else {
            results[name] = [index]
          }
        })
      })
    })

    await Promise.all(names.map((n) => lanes.get(n).onIdle()))
    names.forEach((name) => {
      expect(results[name]).toEqual(times)
    })
    expect(lanes.size).toEqual(0)
  })
})

test('truly parallel', async () => {
  const queue = new NamedTaskQueue()
  const timeout = 200
  const fire = (ms: number) => {
    return new Promise<number>((resolve) => {
      setTimeout(() => {
        resolve(new Date().valueOf())
      }, ms)
    })
  }
  const now = new Date().valueOf()
  const tasks = [queue.run('foo', () => fire(timeout)), queue.run('blah', () => fire(timeout))]
  const whenFired = await Promise.all(tasks)
  whenFired.forEach((when) => {
    const delta = Math.abs(when - now - timeout)
    expect(delta).toBeLessThan(timeout)
  })
})

test('onError', async () => {
  const errors: any[] = []
  const lanes = new Map<string, TaskQueue>()
  const queue = new NamedTaskQueue((error) => errors.push(error), lanes)
  const times = Array.from({ length: N }).map((_, index) => index)
  times.map((i) => {
    queue.add(name, async () => {
      throw new Error(`Happy #${i}`)
    })
  })
  await lanes.get(name).onIdle()
  times.map((i) => {
    expect(errors[i]).toBeInstanceOf(Error)
    expect(errors[i].message).toEqual(`Happy #${i}`)
  })
  expect(lanes.size).toEqual(0)
})

test('onIdle', async () => {
  const lanes = new Map<string, TaskQueue>()
  const queue = new NamedTaskQueue(noop, lanes)
  const times = Array.from({ length: N }).map((_, index) => index)

  names.forEach((name) => {
    times.map(() => {
      queue.add(name, async () => {
        const waitingTime = Math.floor(Math.random() * 100) // Delay to set up spying
        await new Promise((resolve) => setTimeout(resolve, waitingTime))
      })
    })
  })
  const laneFoo = lanes.get(names[0])
  const laneBlah = lanes.get(names[1])
  const onIdleFoo = jest.spyOn(laneFoo, 'onIdle')
  const onIdleBlah = jest.spyOn(laneBlah, 'onIdle')
  await queue.onIdle()
  expect(onIdleBlah).toBeCalledTimes(1)
  expect(onIdleFoo).toBeCalledTimes(1)
  expect(lanes.size).toEqual(0)
})
