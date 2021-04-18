import getPort from 'get-port';
import { IpfsApi, LogLevel } from '@ceramicnetwork/common';
import * as tmp from 'tmp-promise';
import { createIPFS } from './create-ipfs';
import Ceramic from '@ceramicnetwork/core';
import * as random from '@stablelib/random';
import CeramicDaemon, { makeCeramicConfig } from '../ceramic-daemon';
import CeramicClient from '@ceramicnetwork/http-client';
import { makeDID } from './make-did';
import { TileDocument } from '@ceramicnetwork/doctype-tile';
import * as path from 'path';
import * as fs from 'fs';

const TOPIC = `/${random.randomString(10)}`;
const SEED = 'Hello, crypto!';

let ipfs: IpfsApi;
let core: Ceramic;
let client: CeramicClient;
let daemon: CeramicDaemon;
let tmpFolder: tmp.DirectoryResult;

function safeRead(filepath: string): string {
  if (fs.existsSync(filepath)) {
    return fs.readFileSync(filepath).toString();
  } else {
    return '';
  }
}

beforeAll(async () => {
  tmpFolder = await tmp.dir({ unsafeCleanup: true });
  ipfs = await createIPFS(tmpFolder.path);
  const stateStoreDirectory = tmpFolder.path;
  core = await Ceramic.create(
    ipfs,
    makeCeramicConfig({
      pubsubTopic: TOPIC,
      stateStoreDirectory,
      // @ts-ignore
      anchorOnRequest: false,
      loggerConfig: {
        logToFiles: true,
        logDirectory: `${stateStoreDirectory}`,
        logLevel: LogLevel.debug,
      },
    }),
  );
  const daemonPort = await getPort();
  daemon = new CeramicDaemon(core, {
    port: daemonPort,
    corsAllowedOrigins: [/.*/],
    loggerConfig: {
      logToFiles: true,
      logDirectory: `${stateStoreDirectory}`,
      logLevel: LogLevel.debug,
    },
  });
  await daemon.listen();
  const apiUrl = `http://localhost:${daemonPort}`;
  client = new CeramicClient(apiUrl, { docSyncInterval: 500 });

  await core.setDID(makeDID(core));
  await client.setDID(makeDID(client, SEED));
});

afterAll(async () => {
  await client.close();
  await daemon.close();
  await core.close();
  await ipfs.stop();
  await tmpFolder.cleanup();
});

test('write to http-access', async () => {
  const httpAccessLogPath = path.resolve(tmpFolder.path, 'http-access.log');
  await TileDocument.create(client, { test: 123 }, null, { anchor: false, publish: false, syncTimeoutSeconds:0 });
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const httpAccessLog = safeRead(httpAccessLogPath);
  const lines = httpAccessLog.split('\n');
  const lastLine = lines[lines.length - 2];
  expect(lastLine).toContain('error_message=-');
  expect(lastLine).toContain('error_code=-');
  expect(lastLine).toContain('status=200');
});

test('write error to http access log: no error code', async () => {
  const httpAccessLogPath = path.resolve(tmpFolder.path, 'http-access.log');
  core.createStreamFromGenesis = async () => {
    throw new Error(`BANG`);
  };
  await expect(
    TileDocument.create(client, { test: 123 }, null, { anchor: false, publish: false, syncTimeoutSeconds:0 }),
  ).rejects.toThrow();
  await new Promise((resolve) => setTimeout(resolve, 300));
  const httpAccessLog = safeRead(httpAccessLogPath);
  const lines = httpAccessLog.split('\n');
  const lastLine = lines[lines.length - 2];
  expect(lastLine).toContain('error_message=BANG');
  expect(lastLine).toContain('error_code=-');
  expect(lastLine).toContain('status=500');
});

test('write error to http access log: with error code', async () => {
  const httpAccessLogPath = path.resolve(tmpFolder.path, 'http-access.log');
  class FauxError extends Error {
    readonly code = 345;
  }
  core.createStreamFromGenesis = async () => {
    throw new FauxError(`BANG`);
  };
  await expect(
    TileDocument.create(client, { test: 123 }, null, { anchor: false, publish: false, syncTimeoutSeconds:0 }),
  ).rejects.toThrow();
  await new Promise((resolve) => setTimeout(resolve, 300));
  const httpAccessLog = safeRead(httpAccessLogPath);
  const lines = httpAccessLog.split('\n');
  const lastLine = lines[lines.length - 2];
  expect(lastLine).toContain('error_message=BANG');
  expect(lastLine).toContain('error_code=345');
  expect(lastLine).toContain('status=500');
});

test('report error to diagnostics log', async () => {
  const diagnosticsLogPath = path.resolve(tmpFolder.path, 'diagnostics.log');
  core.createStreamFromGenesis = async () => {
    throw new Error(`BANG`);
  };
  await expect(
    TileDocument.create(client, { test: 123 }, null, { anchor: false, publish: false, syncTimeoutSeconds:0 }),
  ).rejects.toThrow();
  await new Promise((resolve) => setTimeout(resolve, 300));
  const diagnosticsLog = safeRead(diagnosticsLogPath);
  const lines = diagnosticsLog.split('\n');
  const lastLine = lines[lines.length - 2];
  expect(lastLine).toContain('Error: BANG');
});
