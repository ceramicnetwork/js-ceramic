import PQueue from 'p-queue';
import { NamedPQueue } from '../named-p-queue';

test('sequential tasks', async () => {
  const name = 'foo';
  const N = 10;
  const results = [];
  const lanes = new Map<string, PQueue>();
  const queue = new NamedPQueue(lanes);
  const times = Array.from({ length: N }).map((_, index) => index);
  await Promise.all(
    times.map((i) => {
      return queue.add(name, async () => {
        results.push(i);
      });
    }),
  );
  expect(results).toEqual(times);
  expect(lanes.size).toEqual(0);
});

test('parallel queues', async () => {
  const N = 10;
  const names = ['foo', 'blah'];
  const results: Record<string, number[]> = {};
  const lanes = new Map<string, PQueue>();
  const queue = new NamedPQueue(lanes);
  const times = Array.from({ length: N }).map((_, index) => index);

  const forName = (name: string) =>
    Promise.all(
      times.map((index) => {
        return queue.add(name, async () => {
          const found = results[name];
          if (found) {
            found.push(index);
          } else {
            results[name] = [index];
          }
        });
      }),
    );

  await Promise.all(names.map((name) => forName(name)));
  names.forEach((name) => {
    expect(results[name]).toEqual(times);
  });
  expect(lanes.size).toEqual(0);
});

test('truly parallel', async () => {
  const queue = new NamedPQueue();
  const timeout = 200
  const fire = (ms: number) => {
    return new Promise<number>((resolve) => {
      setTimeout(() => {
        resolve(new Date().valueOf());
      }, ms);
    });
  };
  const now = new Date().valueOf()
  const tasks = [queue.add('foo', () => fire(timeout)), queue.add('blah', () => fire(timeout))];
  const whenFired = await Promise.all(tasks);
  whenFired.forEach(when => {
    const delta = Math.abs((when - now) - timeout)
    expect(delta).toBeLessThan(10)
  })
});
