import { LocalPinApi } from '../local-pin-api';
import DocID from '@ceramicnetwork/docid';
import { Document } from '../document';
import * as random from '@stablelib/random';
import { LoggerProvider } from "@ceramicnetwork/common";
import { Repository } from '../state-management/repository';

const DOC_ID = DocID.fromString('k2t6wyfsu4pg0t2n4j8ms3s33xsgqjhtto04mvq8w5a2v5xo48idyz38l7ydki');

const repository = ({ pin: jest.fn(), unpin: jest.fn(), list: jest.fn() } as unknown) as Repository;

const document = ({ doctype: 'tile' } as unknown) as Document;
const loadDoc = jest.fn(async () => document);

const pinApi = new LocalPinApi(repository, loadDoc, new LoggerProvider().getDiagnosticsLogger())

async function toArray<A>(iterable: AsyncIterable<A>): Promise<A[]> {
  const result: A[] = [];
  for await (const i of iterable) result.push(i);
  return result;
}

test('add', async () => {
  await pinApi.add(DOC_ID);
  expect(loadDoc).toBeCalledWith(DOC_ID);
  expect(repository.pin).toBeCalledWith(document);
});

test('rm', async () => {
  await pinApi.rm(DOC_ID);
  expect(repository.unpin).toBeCalledWith(DOC_ID);
});

describe('ls', () => {
  test('no docId: list all', async () => {
    const length = Math.floor(Math.random() * 10);
    const expected = Array.from({ length }).map(() => random.randomString(10));
    repository.listPinned = jest.fn(async () => expected);
    const iterable = await pinApi.ls();
    const actual = await toArray(iterable);
    expect(actual).toEqual(expected);
    expect(repository.listPinned).toBeCalledWith(null);
  });
  test('docId: present: list it', async () => {
    const expected = [DOC_ID.toString()];
    repository.listPinned = jest.fn(async () => expected);
    const iterable = await pinApi.ls(DOC_ID);
    const actual = await toArray(iterable);
    expect(actual).toEqual(expected);
    expect(repository.listPinned).toBeCalledWith(DOC_ID);
  });
  test('docId: absent: empty list', async () => {
    const expected = [];
    repository.listPinned = jest.fn(async () => expected);
    const iterable = await pinApi.ls(DOC_ID);
    const actual = await toArray(iterable);
    expect(actual).toEqual(expected);
    expect(repository.listPinned).toBeCalledWith(DOC_ID);
  });
});
