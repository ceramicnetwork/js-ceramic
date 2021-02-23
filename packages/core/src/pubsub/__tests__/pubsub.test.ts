import { LoggerProvider } from '@ceramicnetwork/common';
import { Pubsub } from '../pubsub';
import { MsgType } from '../pubsub-message';
import { DocID } from '@ceramicnetwork/docid';
import { bufferCount, first } from 'rxjs/operators';
import * as random from '@stablelib/random';
import { asIpfsMessage } from './as-ipfs-message';
import { from } from 'rxjs';

const TOPIC = 'test';
const loggerProvider = new LoggerProvider();
const pubsubLogger = loggerProvider.makeServiceLogger('pubsub');
const diagnosticsLogger = loggerProvider.getDiagnosticsLogger();
const FAKE_DOC_ID = DocID.fromString('kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s');
const OUTER_PEER_ID = 'OUTER_PEER_ID';
const PEER_ID = 'PEER_ID';

const LENGTH = 2;
const MESSAGES = Array.from({ length: LENGTH }).map((_, index) => {
  return {
    typ: MsgType.QUERY as MsgType.QUERY,
    id: index.toString(),
    doc: FAKE_DOC_ID,
  };
});
const OUTER_MESSAGES = MESSAGES.map((message) => asIpfsMessage(message, OUTER_PEER_ID));
const OUTER_GARBAGE = Array.from({ length: LENGTH }).map(() => {
  return {
    from: OUTER_PEER_ID,
    data: random.randomBytes(32),
    topicIDs: [TOPIC],
    seqno: random.randomBytes(10),
  };
});

test('pass incoming messages, omit garbage', async () => {
  const feed$ = from(OUTER_GARBAGE.concat(OUTER_MESSAGES));
  const ipfs = {
    pubsub: {
      subscribe: async (_, handler) => {
        feed$.subscribe(handler);
      },
      unsubscribe: jest.fn(),
      ls: jest.fn(() => []),
    },
    id: async () => ({ id: PEER_ID }),
  };
  const pubsub = new Pubsub(ipfs, TOPIC, 3000, pubsubLogger, diagnosticsLogger);
  // Even if garbage is first, we only receive well-formed messages
  const received = pubsub.pipe(bufferCount(LENGTH), first()).toPromise();
  expect(await received).toEqual(MESSAGES);
});
