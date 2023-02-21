import tmp from 'tmp-promise'
import { writeFile } from 'node:fs/promises'
import { DaemonConfig } from '../daemon-config.js'
import { homedir } from 'node:os'

const mockNodeConfig = {
  'private-seed-url':
    'inplace:ed25519#85704d3f4712d11be488bff0590eead8d4971b2c16b32ea23d6a00d53f3e7dad',
}

describe('reading from file', () => {
  let folder: tmp.DirectoryResult
  let configFilepath: URL
  beforeEach(async () => {
    folder = await tmp.dir({ unsafeCleanup: true })
    const base = new URL(`file://${folder.path}/`)
    configFilepath = new URL(`./config.json`, base)
  })
  afterEach(async () => {
    await folder.cleanup()
  })

  test('read config from file', async () => {
    const config = { node: mockNodeConfig }
    await writeFile(configFilepath, JSON.stringify(config))
    await expect(DaemonConfig.fromFile(configFilepath)).resolves.toBeInstanceOf(DaemonConfig)
  })
  test('error if missing node.private-seed-url', async () => {
    const config = { node: {} }
    await writeFile(configFilepath, JSON.stringify(config))
    await expect(DaemonConfig.fromFile(configFilepath)).rejects.toThrow(
      'Daemon config is missing node.private-seed-url'
    )
  })
  test('set private-seed-url from file', async () => {
    const config = { node: mockNodeConfig }
    await writeFile(configFilepath, JSON.stringify(config))
    const daemonConfig = await DaemonConfig.fromFile(configFilepath)
    expect(daemonConfig.node.sensitive_privateSeedUrl()).toEqual(mockNodeConfig['private-seed-url'])
  })
  test('expand relative path', async () => {
    const config = {
      logger: {
        'log-directory': './log-dir/',
      },
      'state-store': {
        'local-directory': './statestore/',
      },
      node: mockNodeConfig,
    }
    await writeFile(configFilepath, JSON.stringify(config))
    const read = await DaemonConfig.fromFile(configFilepath)
    expect(read.logger.logDirectory).toEqual(new URL('./log-dir/', configFilepath).pathname)
    expect(read.stateStore.localDirectory).toEqual(
      new URL('./statestore/', configFilepath).pathname
    )
  })
  test('expand home-dir path', async () => {
    const config = {
      logger: {
        'log-directory': '~/log-dir/',
      },
      'state-store': {
        'local-directory': '~/statestore/',
      },
      node: mockNodeConfig,
    }
    await writeFile(configFilepath, JSON.stringify(config))
    const read = await DaemonConfig.fromFile(configFilepath)
    const home = new URL(`file://${homedir()}/`)
    expect(read.logger.logDirectory).toEqual(new URL('./log-dir/', home).pathname)
    expect(read.stateStore.localDirectory).toEqual(new URL('./statestore/', home).pathname)
  })
  test('expand cwd path', async () => {
    const config = {
      logger: {
        'log-directory': '~+/log-dir/',
      },
      'state-store': {
        'local-directory': '~+/statestore/',
      },
      node: mockNodeConfig,
    }
    await writeFile(configFilepath, JSON.stringify(config))
    const read = await DaemonConfig.fromFile(configFilepath)
    expect(read.logger.logDirectory).toEqual(`${process.cwd()}/log-dir/`)
    expect(read.stateStore.localDirectory).toEqual(`${process.cwd()}/statestore/`)
  })
  test('do not expand absolute path', async () => {
    const config = {
      logger: {
        'log-directory': '/log-dir/',
      },
      'state-store': {
        'local-directory': '/var/ceramic/statestore/',
      },
      node: mockNodeConfig,
    }
    await writeFile(configFilepath, JSON.stringify(config))
    const read = await DaemonConfig.fromFile(configFilepath)
    expect(read.logger.logDirectory).toEqual('/log-dir/')
    expect(read.stateStore.localDirectory).toEqual('/var/ceramic/statestore/')
  })
})

describe('stringify', () => {
  test('excludes node.private-seed-url from string representation', async () => {
    // includes everything if not DaemonConfig type
    const config = { node: mockNodeConfig }
    const configString = JSON.stringify(config)
    expect(configString.includes('node')).toBeTruthy()
    expect(configString.includes('private-seed-url')).toBeTruthy()
    expect(configString.includes(mockNodeConfig['private-seed-url'])).toBeTruthy()

    // expcludes sensitive field from DaemonConfig type
    const daemonConfig = DaemonConfig.fromObject(config)
    const daemonConfigString = JSON.stringify(daemonConfig)
    expect(daemonConfigString.includes('node')).toBeTruthy()
    expect(daemonConfigString.includes('private-seed-url')).toBeFalsy()
    expect(daemonConfigString.includes(mockNodeConfig['private-seed-url'])).toBeFalsy()
    // keeps private-seed-url in object
    expect(daemonConfig.node.sensitive_privateSeedUrl()).toEqual(mockNodeConfig['private-seed-url'])
  })
})
