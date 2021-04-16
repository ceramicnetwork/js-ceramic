import CID from 'cids';
import { CommitType, DocState } from '@ceramicnetwork/common';
import { Document } from '../document';

const FAKE_CID_1 = new CID('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu');
const FAKE_CID2 = new CID('bafybeig6xv5nwphfmvcnektpnojts44jqcuam7bmye2pb54adnrtccjlsu');

test('emit on distinct changes', async () => {
  const initial = ({
    type: 0,
    log: [
      {
        type: CommitType.GENESIS,
        cid: FAKE_CID_1,
      },
    ],
  } as unknown) as DocState;
  const second = ({
    ...initial,
    log: [
      ...initial.log,
      {
        type: CommitType.SIGNED,
        cid: FAKE_CID2,
      },
    ],
  } as unknown) as DocState;

  const state$ = new Document(initial, '', 1000);
  // Disable background polling to avoid getting an error from node-fetch since there's no
  // daemon listening to receive the requests.
  state$._syncState = async function() { /* do nothing*/ }
  const updates: DocState[] = [];
  state$.subscribe((state) => {
    updates.push(state);
  });
  expect(updates.length).toEqual(1);
  expect(updates[0]).toBe(initial);

  state$.next(initial);
  // No change
  expect(updates.length).toEqual(1);
  expect(updates[0]).toBe(initial);

  state$.next(initial);
  // Still no change
  expect(updates.length).toEqual(1);
  expect(updates[0]).toBe(initial);

  state$.next(second);
  // Push second state
  expect(updates.length).toEqual(2);
  expect(updates[0]).toBe(initial);
  expect(updates[1]).toBe(second);

  state$.next(second);
  // No change
  expect(updates.length).toEqual(2);
  expect(updates[0]).toBe(initial);
  expect(updates[1]).toBe(second);

  state$.complete()
});
