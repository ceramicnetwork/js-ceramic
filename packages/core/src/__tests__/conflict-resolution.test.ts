import CID from 'cids';
import * as uint8arrays from 'uint8arrays';
import * as sha256 from '@stablelib/sha256';
import { AnchorStatus, CommitType, LogEntry, StreamState } from '@ceramicnetwork/common';
import { fetchLog, HistoryLog, pickLogToAccept } from '../conflict-resolution';
import * as random from '@stablelib/random';
import { Dispatcher } from '../dispatcher';

describe('pickLogToAccept', () => {
  let cids: CID[];

  beforeEach(() => {
    // Provide a random group of CIDs to work with, in increasing lexicographic order
    const makeCID = (data: string): CID => {
      const body = uint8arrays.concat([
        uint8arrays.fromString('1220', 'base16'),
        sha256.hash(uint8arrays.fromString(data)),
      ]);
      return new CID(1, 'sha2-256', body);
    };
    cids = [makeCID('aaaa'), makeCID('bbbb'), makeCID('cccc'), makeCID('dddd'), makeCID('eeeee')];
    cids.sort(function (cid1, cid2) {
      if (cid1.bytes < cid2.bytes) {
        return -1;
      } else if (cid1.bytes > cid2.bytes) {
        return 1;
      } else {
        return 0;
      }
    });
  });

  it('Neither log is anchored, same log lengths', async () => {
    const state1 = {
      anchorStatus: AnchorStatus.NOT_REQUESTED,
      log: [{ cid: cids[1] }, { cid: cids[2] }],
      metadata: {},
    } as unknown as StreamState;

    const state2 = {
      anchorStatus: AnchorStatus.PENDING,
      log: [{ cid: cids[4] }, { cid: cids[0] }],
      metadata: {},
    } as unknown as StreamState;

    // When neither log is anchored and log lengths are the same we should pick the log whose last entry has the
    // smaller CID.
    expect(await pickLogToAccept(state1, state2)).toEqual(state2);
    expect(await pickLogToAccept(state2, state1)).toEqual(state2);
  });

  it('Neither log is anchored, different log lengths', async () => {
    const state1 = {
      anchorStatus: AnchorStatus.NOT_REQUESTED,
      log: [{ cid: cids[1] }, { cid: cids[2] }, { cid: cids[3] }],
      metadata: {},
    } as unknown as StreamState;

    const state2 = {
      anchorStatus: AnchorStatus.PENDING,
      log: [{ cid: cids[4] }, { cid: cids[0] }],
      metadata: {},
    } as unknown as StreamState;

    // When neither log is anchored and log lengths are different we should pick the log with greater length
    expect(await pickLogToAccept(state1, state2)).toEqual(state1);
    expect(await pickLogToAccept(state2, state1)).toEqual(state1);
  });

  it('One log anchored before the other', async () => {
    const state1 = {
      anchorStatus: AnchorStatus.PENDING,
    } as unknown as StreamState;

    const state2 = {
      anchorStatus: AnchorStatus.ANCHORED,
    } as unknown as StreamState;

    // When only one of the logs has been anchored, we pick the anchored one
    expect(await pickLogToAccept(state1, state2)).toEqual(state2);
    expect(await pickLogToAccept(state2, state1)).toEqual(state2);
  });

  it('Both logs anchored in different blockchains', async () => {
    const proof1 = {
      chainId: 'chain1',
      blockTimestamp: 5,
    };
    const state1 = {
      anchorStatus: AnchorStatus.ANCHORED,
      anchorProof: proof1,
    } as unknown as StreamState;

    const proof2 = {
      chainId: 'chain2',
      blockTimestamp: 10,
    };
    const state2 = {
      anchorStatus: AnchorStatus.ANCHORED,
      anchorProof: proof2,
    } as unknown as StreamState;

    // We do not currently support multiple blockchains
    await expect(pickLogToAccept(state1, state2)).rejects.toThrow(
      'Conflicting logs on the same stream are anchored on different chains. Chain1: chain1, chain2: chain2',
    );
    await expect(pickLogToAccept(state2, state1)).rejects.toThrow(
      'Conflicting logs on the same stream are anchored on different chains. Chain1: chain2, chain2: chain1',
    );
  });

  it('Both logs anchored in same blockchains in different blocks', async () => {
    const proof1 = {
      chainId: 'myblockchain',
      blockNumber: 10,
    };
    const state1 = {
      anchorStatus: AnchorStatus.ANCHORED,
      anchorProof: proof1,
    } as unknown as StreamState;

    const proof2 = {
      chainId: 'myblockchain',
      blockNumber: 5,
    };
    const state2 = {
      anchorStatus: AnchorStatus.ANCHORED,
      anchorProof: proof2,
    } as unknown as StreamState;

    // When anchored in the same blockchain, should take log with earlier block number
    expect(await pickLogToAccept(state1, state2)).toEqual(state2);
    expect(await pickLogToAccept(state2, state1)).toEqual(state2);
  });

  it('Both logs anchored in same blockchains in the same block with different log lengths', async () => {
    const proof1 = {
      chainId: 'myblockchain',
      blockNumber: 10,
    };
    const state1 = {
      anchorStatus: AnchorStatus.ANCHORED,
      anchorProof: proof1,
      metadata: {},
      log: [{ cid: cids[1] }, { cid: cids[2] }, { cid: cids[3] }],
    } as unknown as StreamState;

    const proof2 = {
      chainId: 'myblockchain',
      blockNumber: 10,
    };
    const state2 = {
      anchorStatus: AnchorStatus.ANCHORED,
      anchorProof: proof2,
      metadata: {},
      log: [{ cid: cids[4] }, { cid: cids[0] }],
    } as unknown as StreamState;

    // When anchored in the same blockchain, same block, and with same log lengths, we should choose the one with
    // longer log length
    expect(await pickLogToAccept(state1, state2)).toEqual(state1);
    expect(await pickLogToAccept(state2, state1)).toEqual(state1);
  });

  it('Both logs anchored in same blockchains in the same block with same log lengths', async () => {
    const proof1 = {
      chainId: 'myblockchain',
      blockNumber: 10,
    };
    const state1 = {
      anchorStatus: AnchorStatus.ANCHORED,
      anchorProof: proof1,
      metadata: {},
      log: [{ cid: cids[1] }, { cid: cids[2] }],
    } as unknown as StreamState;

    const proof2 = {
      chainId: 'myblockchain',
      blockNumber: 10,
    };
    const state2 = {
      anchorStatus: AnchorStatus.ANCHORED,
      anchorProof: proof2,
      metadata: {},
      log: [{ cid: cids[4] }, { cid: cids[0] }],
    } as unknown as StreamState;

    // When anchored in the same blockchain, same block, and with same log lengths, we should use
    // the fallback mechanism of picking the log whose last entry has the smaller CID
    expect(await pickLogToAccept(state1, state2)).toEqual(state2);
    expect(await pickLogToAccept(state2, state1)).toEqual(state2);
  });
});

describe('fetchLog', () => {
  const cidRecords: Record<string, any> = {};
  const fauxDispatcher = {
    retrieveCommit: (cid: CID) => {
      return cidRecords[cid.toString()];
    },
    retrieveFromIPFS: (cid: CID) => {
      return cidRecords[cid.toString()];
    },
  } as unknown as Dispatcher;

  function randomCID() {
    const body = uint8arrays.concat([uint8arrays.fromString('1220', 'base16'), random.randomBytes(32)]);
    return new CID(1, 'sha2-256', body);
  }

  function logEntry(type: CommitType, prev?: CID): LogEntry {
    const body = uint8arrays.concat([uint8arrays.fromString('1220', 'base16'), random.randomBytes(32)]);
    const cid = new CID(1, 'sha2-256', body);
    if (type == CommitType.ANCHOR) {
      const timestamp = Math.floor(Math.random() * 100000);
      const proofCID = randomCID();
      cidRecords[proofCID.toString()] = {
        blockTimestamp: timestamp,
      };
      cidRecords[cid.toString()] = {
        proof: proofCID,
        prev: prev,
      };
      return {
        cid: cid,
        type: type,
        timestamp: timestamp,
      };
    } else {
      if (prev) {
        // signed
        const link = randomCID();
        cidRecords[link.toString()] = { prev: prev };
        cidRecords[cid.toString()] = {
          link: link,
        };
      } else {
        // genesis
        cidRecords[cid.toString()] = {};
      }
      return {
        cid: cid,
        type: type,
      };
    }
  }

  test('no anchor commit', async () => {
    const a = logEntry(CommitType.GENESIS);
    const b = logEntry(CommitType.SIGNED, a.cid);
    const history = new HistoryLog(fauxDispatcher, [a]);

    const result = await fetchLog(fauxDispatcher, b.cid, history);
    const target = result.find((entry) => entry.cid.equals(b.cid));
    expect(target.timestamp).toBeUndefined();
  });
  test('immediately next anchor commit', async () => {
    const a = logEntry(CommitType.GENESIS);
    const b = logEntry(CommitType.SIGNED, a.cid);
    const c = logEntry(CommitType.ANCHOR, b.cid);
    const history = new HistoryLog(fauxDispatcher, [a]);

    const result = await fetchLog(fauxDispatcher, c.cid, history);
    const target = result.find((entry) => entry.cid.equals(b.cid));
    expect(target.timestamp).toEqual(c.timestamp);
  });
  test('next anchor commit', async () => {
    const a = logEntry(CommitType.GENESIS);
    const b = logEntry(CommitType.SIGNED, a.cid);
    const c = logEntry(CommitType.SIGNED, b.cid);
    const d = logEntry(CommitType.ANCHOR, c.cid);
    const history = new HistoryLog(fauxDispatcher, [a]);

    const result = await fetchLog(fauxDispatcher, d.cid, history);
    const target = result.find((entry) => entry.cid.equals(b.cid));
    expect(target.timestamp).toEqual(d.timestamp);
  });
  test('not in log', async () => {
    const a = logEntry(CommitType.GENESIS);
    const b = randomCID();
    cidRecords[b.toString()] = {};
    const history = new HistoryLog(fauxDispatcher, [a]);

    const result = await fetchLog(fauxDispatcher, b, history);
    expect(result).toEqual([]);
  });
});
