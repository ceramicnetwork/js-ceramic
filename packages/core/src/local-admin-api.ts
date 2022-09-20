import { AdminApi, DiagnosticsLogger, Stream } from '@ceramicnetwork/common/lib'
import { Repository } from './state-management/repository.js'
import { StreamID } from '@ceramicnetwork/streamid'

/**
 * AdminApi for Ceramic core.
 */
export class LocalAdminApi implements AdminApi {
  constructor(
    private readonly repository: Repository,
    private readonly logger: DiagnosticsLogger
  ) {}

  addModelsToIndex(modelsIDs: Array<StreamID>): Promise<void> {
    throw Error('Adding models to index not implemented in local admin api')
    return
  }

  getModelsFromIndex(): Promise<Array<Stream>> {
    throw Error('Getting models from index not implemented in local admin api')
    return
  }

  removeModelsFromIndex(modelsIDs: Array<StreamID>): Promise<void> {
    throw Error('Removing models from index not implemented in local admin api')
    return


  }

  replaceModelsInIndex(modelsIDs: Array<StreamID>): Promise<void> {
    throw Error('Replacing models in index not implemented in local admin api')
    return
  }
}
