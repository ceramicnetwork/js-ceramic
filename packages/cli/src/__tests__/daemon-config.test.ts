import tmp from 'tmp-promise'
import { writeFile } from 'node:fs/promises'
import { DaemonConfig } from '../daemon-config.js'
import { homedir } from 'node:os'

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
    const config = {}
    await writeFile(configFilepath, JSON.stringify(config))
    await expect(DaemonConfig.fromFile(configFilepath)).resolves.toBeInstanceOf(DaemonConfig)
  })
  test('expand relative path', async () => {
    const config = {
      logger: {
        'log-directory': './log-dir/',
      },
      'state-store': {
        'local-directory': './state-store/',
      },
    }
    await writeFile(configFilepath, JSON.stringify(config))
    const read = await DaemonConfig.fromFile(configFilepath)
    expect(read.logger.logDirectory).toEqual(new URL('./log-dir/', configFilepath).pathname)
    expect(read.stateStore.localDirectory).toEqual(
      new URL('./state-store/', configFilepath).pathname
    )
  })
  test('expand home-dir path', async () => {
    const config = {
      logger: {
        'log-directory': '~/log-dir/',
      },
      'state-store': {
        'local-directory': '~/state-store/',
      },
    }
    await writeFile(configFilepath, JSON.stringify(config))
    const read = await DaemonConfig.fromFile(configFilepath)
    const home = new URL(`file://${homedir()}/`)
    expect(read.logger.logDirectory).toEqual(new URL('./log-dir/', home).pathname)
    expect(read.storage.localDirectory).toEqual(new URL('./state-store/', home).pathname)
  })
  test('expand cwd path', async () => {
    const config = {
      logger: {
        'log-directory': '~+/log-dir/',
      },
      'state-store': {
        'local-directory': '~+/state-store/',
      },
    }
    await writeFile(configFilepath, JSON.stringify(config))
    const read = await DaemonConfig.fromFile(configFilepath)
    expect(read.logger.logDirectory).toEqual(`${process.cwd()}/log-dir/`)
    expect(read.stateStore.localDirectory).toEqual(`${process.cwd()}/state-store/`)
  })
  test('do not expand absolute path', async () => {
    const config = {
      logger: {
        'log-directory': '/log-dir/',
      },
      'state-store': {
        'local-directory': '/var/ceramic/state-store/',
      },
    }
    await writeFile(configFilepath, JSON.stringify(config))
    const read = await DaemonConfig.fromFile(configFilepath)
    expect(read.logger.logDirectory).toEqual('/log-dir/')
    expect(read.stateStore.localDirectory).toEqual('/var/ceramic/state-store/')
  })
})
