import { AdminApi, Stream } from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid';

/**
 * AdminApi for Ceramic http client.
 */
export class RemoteAdminApi implements AdminApi {
  constructor(private readonly _apiUrl: URL) {}

  addModelsToIndex(modelsIDs: Array<StreamID>): Promise<void> {
    throw Error('Adding models to index not implemented in remote admin api')
    return
  }

  getModelsFromIndex(): Promise<Array<Stream>> {
    throw Error('Getting models from index not implemented in remote admin api')
    return
  }

  removeModelsFromIndex(modelsIDs: Array<StreamID>): Promise<void> {
    throw Error('Removing models from index not implemented in remote admin api')
    return
  }

  replaceModelsInIndex(modelsIDs: Array<StreamID>): Promise<void> {
    throw Error('Replacing models in index not implemented in remote admin api')
    return
  }
}
