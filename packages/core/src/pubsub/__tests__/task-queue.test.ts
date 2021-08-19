import { noop, TaskQueue } from '../task-queue'

async function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), ms)
  })
}

test('add synchronously', async () => {
  const tasks = new TaskQueue()
  let n = 0
  tasks.add(async () => {
    await delay(100)
    n++
  })
  await tasks.onIdle()
  expect(n).toEqual(1)
})

test('common error handler', async () => {
  const onError = jest.fn()
  const tasks = new TaskQueue(onError)
  const error = new Error(`Horror #${Math.random()}`)
  const accumulator = []
  tasks.add(async () => {
    throw error
  })
  tasks.add(async () => {
    await delay(300)
    accumulator.push(1)
  })
  tasks.add(async () => {
    await delay(200)
    throw error
  })
  await tasks.onIdle()
  expect(onError).toBeCalledTimes(2)
  expect(onError).toBeCalledWith(error, expect.any(Function))
})

test('sequential execution', async () => {
  const tasks = new TaskQueue()
  const accumulator = []
  tasks.add(async () => {
    await delay(300)
    accumulator.push(1)
  })
  tasks.add(async () => {
    await delay(200)
    accumulator.push(2)
  })
  tasks.add(async () => {
    accumulator.push(3)
  })
  await tasks.onIdle()
  expect(accumulator).toEqual([1, 2, 3])
})

test('clear', async () => {
  const tasks = new TaskQueue()
  const accumulator = []
  tasks.add(async () => {
    await delay(300)
    accumulator.push(1)
  })
  tasks.add(async () => {
    await delay(200)
    accumulator.push(2)
  })
  tasks.add(async () => {
    accumulator.push(3)
  })
  await delay(200)
  tasks.clear()
  await tasks.onIdle()
  expect(accumulator).toEqual([1])
})

test('retry', async () => {
  let n = 0
  const task = async () => {
    n = n + 1
    if (n <= 3) throw new Error(`Retry maybe`)
  }
  const queue = new TaskQueue((error, retry) => {
    retry()
  })
  queue.add(task)
  await queue.onIdle()
  expect(n).toEqual(2) // Retried 3 times
})

test('max size', async () => {
  const tasks = new TaskQueue(noop, 2)
  let n = 0

  // Add 1 task
  const firstTaskDone = new Promise<void>((resolve, _) => {
    tasks.add(async () => {
      await delay(200)
      n++
    }, resolve)
  })

  // Add second task
  tasks.add(async () => {
    await delay(200)
    n++
  })

  expect(function () {
    tasks.add(async () => {
      await delay(200)
      n++
    })
  }).toThrow(/max task queue size/)

  // After a task has finished and the number of current tasks has dipped back below the max, then
  // adding new tasks should become possible again.
  await firstTaskDone
  tasks.add(async () => {
    await delay(200)
    n++
  })

  await tasks.onIdle()
  expect(n).toEqual(3)
})
