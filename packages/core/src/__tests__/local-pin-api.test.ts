import { LocalPinApi } from '../local-pin-api';
import { PinStore } from '../store/pin-store';
import DocID from '@ceramicnetwork/docid';
import { Document } from '../document';
import * as random from '@stablelib/random';
import { LoggerProvider } from "@ceramicnetwork/common";

const DOC_ID = DocID.fromString('k2t6wyfsu4pg0t2n4j8ms3s33xsgqjhtto04mvq8w5a2v5xo48idyz38l7ydki');

const pinStore = ({ add: jest.fn(), rm: jest.fn(), ls: jest.fn() } as unknown) as PinStore;

const document = ({ doctype: 'tile' } as unknown) as Document;
const loadDoc = jest.fn(async () => document);

const pinApi = new LocalPinApi(pinStore, loadDoc, new LoggerProvider().getDiagnosticsLogger())

async function toArray<A>(iterable: AsyncIterable<A>): Promise<A[]> {
  const result: A[] = [];
  for await (const i of iterable) result.push(i);
  return result;
}

test('add', async () => {
  await pinApi.add(DOC_ID);
  expect(loadDoc).toBeCalledWith(DOC_ID);
  expect(pinStore.add).toBeCalledWith(document.doctype);
});

test('rm', async () => {
  await pinApi.rm(DOC_ID);
  expect(pinStore.rm).toBeCalledWith(DOC_ID);
});

describe('ls', () => {
  test('no docId: list all', async () => {
    const length = Math.floor(Math.random() * 10);
    const expected = Array.from({ length }).map(() => random.randomString(10));
    pinStore.ls = jest.fn(async () => expected);
    const iterable = await pinApi.ls();
    const actual = await toArray(iterable);
    expect(actual).toEqual(expected);
    expect(pinStore.ls).toBeCalledWith(null);
  });
  test('docId: present: list it', async () => {
    const expected = [DOC_ID.toString()];
    pinStore.ls = jest.fn(async () => expected);
    const iterable = await pinApi.ls(DOC_ID);
    const actual = await toArray(iterable);
    expect(actual).toEqual(expected);
    expect(pinStore.ls).toBeCalledWith(DOC_ID);
  });
  test('docId: absent: empty list', async () => {
    const expected = [];
    pinStore.ls = jest.fn(async () => expected);
    const iterable = await pinApi.ls(DOC_ID);
    const actual = await toArray(iterable);
    expect(actual).toEqual(expected);
    expect(pinStore.ls).toBeCalledWith(DOC_ID);
  });
});
