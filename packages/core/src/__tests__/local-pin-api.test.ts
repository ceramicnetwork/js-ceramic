import { LocalPinApi } from '../local-pin-api';
import StreamID from '@ceramicnetwork/streamid';
import * as random from '@stablelib/random';
import { CommitType, DocState, LoggerProvider } from '@ceramicnetwork/common';
import { Repository } from '../state-management/repository';
import CID from 'cids';
import { RunningState } from '../state-management/running-state';

const DOC_ID = StreamID.fromString('k2t6wyfsu4pg0t2n4j8ms3s33xsgqjhtto04mvq8w5a2v5xo48idyz38l7ydki');
const FAKE_CID = new CID('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu');

const repository = ({ pin: jest.fn(), unpin: jest.fn(), list: jest.fn() } as unknown) as Repository;

const docState = ({
  type: 0,
  log: [{ cid: FAKE_CID, type: CommitType.GENESIS }],
} as unknown) as DocState;
const state$ = new RunningState(docState)
const loadDoc = jest.fn(async () => state$);

const pinApi = new LocalPinApi(repository, loadDoc, new LoggerProvider().getDiagnosticsLogger());

async function toArray<A>(iterable: AsyncIterable<A>): Promise<A[]> {
  const result: A[] = [];
  for await (const i of iterable) result.push(i);
  return result;
}

test('add', async () => {
  await pinApi.add(DOC_ID);
  expect(loadDoc).toBeCalledWith(DOC_ID);
  expect(repository.pin).toBeCalledWith(state$);
});

test('rm', async () => {
  await pinApi.rm(DOC_ID);
  expect(repository.unpin).toBeCalledWith(DOC_ID);
});

describe('ls', () => {
  test('no streamId: list all', async () => {
    const length = Math.floor(Math.random() * 10);
    const expected = Array.from({ length }).map(() => random.randomString(10));
    repository.listPinned = jest.fn(async () => expected);
    const iterable = await pinApi.ls();
    const actual = await toArray(iterable);
    expect(actual).toEqual(expected);
    expect(repository.listPinned).toBeCalledWith(null);
  });
  test('streamId: present: list it', async () => {
    const expected = [DOC_ID.toString()];
    repository.listPinned = jest.fn(async () => expected);
    const iterable = await pinApi.ls(DOC_ID);
    const actual = await toArray(iterable);
    expect(actual).toEqual(expected);
    expect(repository.listPinned).toBeCalledWith(DOC_ID);
  });
  test('streamId: absent: empty list', async () => {
    const expected = [];
    repository.listPinned = jest.fn(async () => expected);
    const iterable = await pinApi.ls(DOC_ID);
    const actual = await toArray(iterable);
    expect(actual).toEqual(expected);
    expect(repository.listPinned).toBeCalledWith(DOC_ID);
  });
});
