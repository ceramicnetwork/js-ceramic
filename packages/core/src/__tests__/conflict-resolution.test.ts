import CID from 'cids';
import * as uint8arrays from 'uint8arrays';
import * as sha256 from '@stablelib/sha256';
import { AnchorStatus, DocState } from '@ceramicnetwork/common';
import { pickLogToAccept } from '../conflict-resolution';

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
    const state1 = ({
      anchorStatus: AnchorStatus.NOT_REQUESTED,
      log: [{ cid: cids[1] }, { cid: cids[2] }],
      metadata: {},
    } as unknown) as DocState;

    const state2 = ({
      anchorStatus: AnchorStatus.PENDING,
      log: [{ cid: cids[4] }, { cid: cids[0] }],
      metadata: {},
    } as unknown) as DocState;

    // When neither log is anchored and log lengths are the same we should pick the log whose last entry has the
    // smaller CID.
    expect(await pickLogToAccept(state1, state2)).toEqual(state2);
    expect(await pickLogToAccept(state2, state1)).toEqual(state2);
  });

  it('Neither log is anchored, different log lengths', async () => {
    const state1 = ({
      anchorStatus: AnchorStatus.NOT_REQUESTED,
      log: [{ cid: cids[1] }, { cid: cids[2] }, { cid: cids[3] }],
      metadata: {},
    } as unknown) as DocState;

    const state2 = ({
      anchorStatus: AnchorStatus.PENDING,
      log: [{ cid: cids[4] }, { cid: cids[0] }],
      metadata: {},
    } as unknown) as DocState;

    // When neither log is anchored and log lengths are different we should pick the log with greater length
    expect(await pickLogToAccept(state1, state2)).toEqual(state1);
    expect(await pickLogToAccept(state2, state1)).toEqual(state1);
  });

  it('One log anchored before the other', async () => {
    const state1 = ({
      anchorStatus: AnchorStatus.PENDING,
    } as unknown) as DocState;

    const state2 = ({
      anchorStatus: AnchorStatus.ANCHORED,
    } as unknown) as DocState;

    // When only one of the logs has been anchored, we pick the anchored one
    expect(await pickLogToAccept(state1, state2)).toEqual(state2);
    expect(await pickLogToAccept(state2, state1)).toEqual(state2);
  });

  it('Both logs anchored in different blockchains', async () => {
    const proof1 = {
      chainId: 'chain1',
      blockTimestamp: 5,
    };
    const state1 = ({
      anchorStatus: AnchorStatus.ANCHORED,
      anchorProof: proof1,
    } as unknown) as DocState;

    const proof2 = {
      chainId: 'chain2',
      blockTimestamp: 10,
    };
    const state2 = ({
      anchorStatus: AnchorStatus.ANCHORED,
      anchorProof: proof2,
    } as unknown) as DocState;

    // We do not currently support multiple blockchains
    await expect(pickLogToAccept(state1, state2)).rejects.toThrow(
      'Conflicting logs on the same document are anchored on different chains. Chain1: chain1, chain2: chain2',
    );
    await expect(pickLogToAccept(state2, state1)).rejects.toThrow(
      'Conflicting logs on the same document are anchored on different chains. Chain1: chain2, chain2: chain1',
    );
  });

  it('Both logs anchored in same blockchains in different blocks', async () => {
    const proof1 = {
      chainId: 'myblockchain',
      blockNumber: 10,
    };
    const state1 = ({
      anchorStatus: AnchorStatus.ANCHORED,
      anchorProof: proof1,
    } as unknown) as DocState;

    const proof2 = {
      chainId: 'myblockchain',
      blockNumber: 5,
    };
    const state2 = ({
      anchorStatus: AnchorStatus.ANCHORED,
      anchorProof: proof2,
    } as unknown) as DocState;

    // When anchored in the same blockchain, should take log with earlier block number
    expect(await pickLogToAccept(state1, state2)).toEqual(state2);
    expect(await pickLogToAccept(state2, state1)).toEqual(state2);
  });

  it('Both logs anchored in same blockchains in the same block with different log lengths', async () => {
    const proof1 = {
      chainId: 'myblockchain',
      blockNumber: 10,
    };
    const state1 = ({
      anchorStatus: AnchorStatus.ANCHORED,
      anchorProof: proof1,
      metadata: {},
      log: [{ cid: cids[1] }, { cid: cids[2] }, { cid: cids[3] }],
    } as unknown) as DocState;

    const proof2 = {
      chainId: 'myblockchain',
      blockNumber: 10,
    };
    const state2 = ({
      anchorStatus: AnchorStatus.ANCHORED,
      anchorProof: proof2,
      metadata: {},
      log: [{ cid: cids[4] }, { cid: cids[0] }],
    } as unknown) as DocState;

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
    const state1 = ({
      anchorStatus: AnchorStatus.ANCHORED,
      anchorProof: proof1,
      metadata: {},
      log: [{ cid: cids[1] }, { cid: cids[2] }],
    } as unknown) as DocState;

    const proof2 = {
      chainId: 'myblockchain',
      blockNumber: 10,
    };
    const state2 = ({
      anchorStatus: AnchorStatus.ANCHORED,
      anchorProof: proof2,
      metadata: {},
      log: [{ cid: cids[4] }, { cid: cids[0] }],
    } as unknown) as DocState;

    // When anchored in the same blockchain, same block, and with same log lengths, we should use
    // the fallback mechanism of picking the log whose last entry has the smaller CID
    expect(await pickLogToAccept(state1, state2)).toEqual(state2);
    expect(await pickLogToAccept(state2, state1)).toEqual(state2);
  });
});
