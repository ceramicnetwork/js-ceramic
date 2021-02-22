import { createIPFS, swarmConnect } from '../../__tests__/ipfs-util';
import { IpfsApi, LoggerProvider } from '@ceramicnetwork/common';
import { Pubsub } from '../pubsub';
import { TaskQueue } from '../task-queue';
import { MsgType, QueryMessage, serialize } from '../pubsub-message';
import { DocID } from '@ceramicnetwork/docid';
import { delay } from './delay';
import { bufferCount, first } from 'rxjs/operators';

let ipfsA: IpfsApi;
let ipfsB: IpfsApi;

beforeEach(async () => {
  ipfsA = await createIPFS();
  ipfsB = await createIPFS()
  await swarmConnect(ipfsB, ipfsA)
});

afterEach(async () => {
  await ipfsA.stop();
  await ipfsB.stop()
});

const TOPIC = 'test'
const loggerProvider = new LoggerProvider()
const pubsubLogger = loggerProvider.makeServiceLogger('pubsub')
const diagnosticsLogger = loggerProvider.getDiagnosticsLogger()
const FAKE_DOC_ID = DocID.fromString('kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s');

test('pass incoming message', async () => {
  const messages = Array.from({length: 10}).map<QueryMessage>((_, i) => {
    return {
      typ: MsgType.QUERY as MsgType.QUERY,
      id: i.toString(),
      doc: FAKE_DOC_ID
    }
  })
  const taskQueue = new TaskQueue()
  const pubsub = new Pubsub(ipfsA, TOPIC, 3000, pubsubLogger, diagnosticsLogger, taskQueue)
  const subscription = pubsub.pipe(bufferCount(10), first()).toPromise()
  await delay(100) // Plumbing
  await Promise.all(messages.map(async (message) => {
    await ipfsB.pubsub.publish(TOPIC, serialize(message))
  }))
  expect(await subscription).toEqual(messages)
});

test.todo('omit mis-formatted messages');
