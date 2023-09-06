import { describe, expect, jest, test } from '@jest/globals'
import type { Dispatcher } from '../../dispatcher.js'
import type { AnchorRequestStore } from '../../store/anchor-request-store.js'
import type { ExecutionQueue } from '../execution-queue.js'
import type { AnchorService, DiagnosticsLogger } from '@ceramicnetwork/common'
import type { ConflictResolution } from '../../conflict-resolution.js'
import type { LocalIndexApi } from '../../indexing/local-index-api.js'
import type { RepositoryInternals } from '../repository-internals.js'
import { TestUtils } from '@ceramicnetwork/common'
import { StateManager } from '../state-manager.js'
import { OperationType } from '../operation-type.js'
import { RunningState } from '../running-state.js'

describe('applyWriteOpts', () => {
  const dispatcher = {} as unknown as Dispatcher
  const anchorRequestStore = {} as unknown as AnchorRequestStore
  const executionQueue = {} as unknown as ExecutionQueue
  const anchorService = {} as unknown as AnchorService
  const conflictResolution = {} as unknown as ConflictResolution
  const logger = {} as unknown as DiagnosticsLogger
  const localIndexApi = {} as unknown as LocalIndexApi
  const publishTipFn = jest.fn()
  const internals = {
    publishTip: publishTipFn,
  } as unknown as RepositoryInternals
  const stateManager = new StateManager(
    dispatcher,
    anchorRequestStore,
    executionQueue,
    anchorService,
    conflictResolution,
    logger,
    localIndexApi,
    internals
  )

  test('publish on LOAD', async () => {
    const publishSpy = jest.spyOn(internals, 'publishTip')
    await stateManager.applyWriteOpts(
      new RunningState(TestUtils.makeStreamState(), false),
      { publish: true },
      OperationType.LOAD
    )
    expect(publishSpy).not.toBeCalled()
  })
  test('publish on UPDATE or CREATE ', async () => {
    const operations = [OperationType.UPDATE, OperationType.CREATE]
    for (const operation of operations) {
      const publishSpy = jest.spyOn(internals, 'publishTip')
      await stateManager.applyWriteOpts(
        new RunningState(TestUtils.makeStreamState(), false),
        { publish: true },
        operation
      )
      expect(publishSpy).toBeCalled()
    }
  })
})
