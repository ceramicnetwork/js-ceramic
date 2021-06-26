import CID from 'cids';
import { CommitType, LogEntry } from '../../stream';
import { StreamUtils } from '../stream-utils';
import * as uint8arrays from 'uint8arrays';
import * as random from '@stablelib/random';

function logEntry(type: CommitType): LogEntry {
  const body = uint8arrays.concat([uint8arrays.fromString('1220', 'base16'), random.randomBytes(32)]);
  const cid = new CID(1, 'sha2-256', body);
  if (type == CommitType.ANCHOR) {
    return {
      cid: cid,
      type: type,
      timestamp: Math.floor(Math.random() * 100000),
    };
  } else {
    return {
      cid: cid,
      type: type,
    };
  }
}

describe('commitTimestamp', () => {
  test('no anchor commit', () => {
    const log = [logEntry(CommitType.GENESIS), logEntry(CommitType.SIGNED)];
    expect(StreamUtils.commitTimestamp(log, log[1].cid)).toBeUndefined();
  });
  test('immediately next anchor commit', () => {
    const log = [
      logEntry(CommitType.GENESIS),
      logEntry(CommitType.SIGNED),
      logEntry(CommitType.ANCHOR),
      logEntry(CommitType.SIGNED),
      logEntry(CommitType.ANCHOR),
    ];
    expect(StreamUtils.commitTimestamp(log, log[1].cid)).toEqual(log[2].timestamp * 1000);
  });
  test('next anchor commit', () => {
    const log = [
      logEntry(CommitType.GENESIS),
      logEntry(CommitType.SIGNED),
      logEntry(CommitType.SIGNED),
      logEntry(CommitType.ANCHOR),
    ];
    expect(StreamUtils.commitTimestamp(log, log[1].cid)).toEqual(log[3].timestamp * 1000);
  });

  test('not in log', () => {
    const log = [logEntry(CommitType.GENESIS), logEntry(CommitType.SIGNED)];
    const orphan = logEntry(CommitType.SIGNED);
    expect(StreamUtils.commitTimestamp(log, orphan.cid)).toBeUndefined();
  });
});
