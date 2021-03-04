import { AsyncLruMap } from '../async-lru-map';

test('set and get', async () => {
  const c = new AsyncLruMap<number>(4);
  expect(c.size).toEqual(0);
  expect(c.limit).toEqual(4);
  expect(c.oldest).toBeUndefined();
  expect(c.newest).toBeUndefined();

  await c.set('adam', 29);
  await c.set('john', 26);
  await c.set('angela', 24);
  await c.set('bob', 48);
  expect(c.toString()).toEqual('adam:29 < john:26 < angela:24 < bob:48');

  await expect(c.get('adam')).resolves.toEqual(29);
  await expect(c.get('john')).resolves.toEqual(26);
  await expect(c.get('angela')).resolves.toEqual(24);
  await expect(c.get('bob')).resolves.toEqual(48);
  expect(c.toString()).toEqual('adam:29 < john:26 < angela:24 < bob:48');

  await expect(c.get('angela')).resolves.toEqual(24);
  expect(c.toString()).toEqual('adam:29 < john:26 < bob:48 < angela:24');

  await c.set('ygwie', 81);
  expect(c.toString()).toEqual('john:26 < bob:48 < angela:24 < ygwie:81');
  expect(c.size).toEqual(4);
  await expect(c.get('adam')).resolves.toBeUndefined();

  await c.set('john', 11);
  expect(c.toString()).toEqual('bob:48 < angela:24 < ygwie:81 < john:11');

  await expect(c.get('john')).resolves.toEqual(11);

  const before = c.size;
  await c.delete('john');
  expect(c.size).toEqual(before - 1);
});

test('onEvicted', async () => {
  type EvictedEntry = [string, number];
  const evicted: EvictedEntry[] = [];
  const c = new AsyncLruMap<number>(2, async (entry) => {
    evicted.push([entry.key, entry.value]);
  });
  await c.set('adam', 29);
  await c.set('john', 26);
  await c.set('angela', 24);
  await c.set('bob', 48);
  expect(evicted).toEqual([
    ['adam', 29],
    ['john', 26],
  ]);
  expect(c.toString()).toEqual('angela:24 < bob:48');
});
