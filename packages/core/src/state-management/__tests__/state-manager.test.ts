import { describe, expect, jest, test } from '@jest/globals'
import type { Dispatcher } from '../../dispatcher.js'
import type { AnchorRequestStore } from '../../store/anchor-request-store.js'
import type { ExecutionQueue } from '../execution-queue.js'
import type { DiagnosticsLogger } from '@ceramicnetwork/common'
import type { LocalIndexApi } from '@ceramicnetwork/indexing'
import type { RepositoryInternals } from '../repository-internals.js'
import type { AnchorService } from '../../anchor/anchor-service.js'
import { TestUtils } from '@ceramicnetwork/common'
import { StateManager } from '../state-manager.js'
import { OperationType } from '../operation-type.js'
import { RunningState } from '../running-state.js'
import { AnchorRequestCarBuilder } from '../../anchor/anchor-request-car-builder.js'

describe('applyWriteOpts', () => {
  const dispatcher = {} as unknown as Dispatcher
  const anchorRequestStore = {} as unknown as AnchorRequestStore
  const executionQueue = {} as unknown as ExecutionQueue
  const anchorService = {} as unknown as AnchorService
  const logger = {} as unknown as DiagnosticsLogger
  const localIndexApi = {} as unknown as LocalIndexApi
  const publishTipFn = jest.fn()
  const internals = {
    publishTip: publishTipFn,
  } as unknown as RepositoryInternals
  const anchorRequestCarBuilder = new AnchorRequestCarBuilder(dispatcher)
  const stateManager = new StateManager(
    dispatcher,
    anchorRequestStore,
    executionQueue,
    anchorService,
    logger,
    localIndexApi,
    internals,
    anchorRequestCarBuilder
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
