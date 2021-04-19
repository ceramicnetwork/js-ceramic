import { StateCache } from '../state-cache';

test('get and set', () => {
  const cache = new StateCache(10);
  cache.set('a', 'a');
  cache.set('b', 'b');
  expect(cache.get('a')).toEqual('a');
  expect(cache.get('b')).toEqual('b');
  expect(cache.volatile.size).toEqual(2);
  expect(cache.durable.size).toEqual(0);
});

describe('LRU', () => {
  test('eviction', () => {
    const cache = new StateCache<() => void>(2, (f) => {
      f();
    });
    const [a, b, c] = [jest.fn(), jest.fn(), jest.fn()];
    cache.set('a', a);
    cache.set('b', b);
    cache.set('c', c);
    expect(a).toBeCalled();
    expect(b).not.toBeCalled();
    expect(c).not.toBeCalled();
    expect(cache.volatile.size).toEqual(2);
    expect(cache.durable.size).toEqual(0);
  });

  test('persist and LRU eviction', () => {
    const cache = new StateCache<() => void>(2, (f) => {
      f();
    });
    const [a, b, c, d] = [jest.fn(), jest.fn(), jest.fn(), jest.fn()];
    cache.set('a', a);
    cache.endure('a', a);
    cache.set('b', b);
    cache.set('c', c);
    cache.set('d', d);
    expect(a).not.toBeCalled();
    expect(b).toBeCalled();
    expect(c).not.toBeCalled();
    expect(d).not.toBeCalled();
    expect(cache.volatile.size).toEqual(2);
    expect(cache.durable.size).toEqual(1);
  });

  test('free', () => {
    const cache = new StateCache<() => void>(2, (f) => {
      f();
    });
    const [a, b, c, d] = [jest.fn(), jest.fn(), jest.fn(), jest.fn()];
    cache.set('a', a);
    cache.endure('a', a);
    cache.set('b', b);
    cache.free('a');
    cache.set('c', c);
    cache.set('d', d);
    expect(a).toBeCalled();
    expect(b).toBeCalled();
    expect(c).not.toBeCalled();
    expect(d).not.toBeCalled();
    expect(cache.volatile.size).toEqual(2);
    expect(cache.durable.size).toEqual(0);
  });
});

describe('iteration', () => {
  let cache: StateCache<number>;

  beforeEach(() => {
    cache = new StateCache(2);
    cache.set('a', 1);
    cache.endure('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    cache.set('d', 4);
  });

  test('iterator', () => {
    const entries: Array<[string, number]> = [];
    for (const entry of cache) {
      entries.push(entry);
    }
    const expected = [
      ['a', 1],
      ['c', 3],
      ['d', 4],
    ];
    expect(entries).toEqual(expected);
    expect(Array.from(cache)).toEqual(expected);
  });

  test('keys', () => {
    const expected = ['a', 'c', 'd'];
    const keys: Array<string> = [];
    for (const k of cache.keys()) {
      keys.push(k);
    }
    expect(keys).toEqual(expected);
    expect(Array.from(cache.keys())).toEqual(expected);
  });

  test('values', () => {
    const expected = [1, 3, 4];
    const values: Array<number> = [];
    for (const value of cache.values()) {
      values.push(value);
    }
    expect(values).toEqual(expected);
    expect(Array.from(cache.values())).toEqual(expected);
  });
});

describe('delete', () => {
  let cache: StateCache<number>;

  beforeEach(() => {
    cache = new StateCache<number>(2);
    cache.set('a', 1);
    cache.endure('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    cache.set('d', 4);
  });

  test('volatile', () => {
    cache.delete('d');
    expect(Array.from(cache.volatile)).toEqual([['c', 3]]);
    expect(Array.from(cache.durable)).toEqual([['a', 1]]);
  });
  test('persistent', () => {
    cache.delete('a');
    expect(Array.from(cache.volatile)).toEqual([
      ['c', 3],
      ['d', 4],
    ]);
    expect(Array.from(cache.durable)).toEqual([]);
  });
  test('non-existent', () => {
    cache.delete('e')
    expect(Array.from(cache.volatile)).toEqual([
      ['c', 3],
      ['d', 4],
    ]);
    expect(Array.from(cache.durable)).toEqual([['a', 1]]);
  });
});
