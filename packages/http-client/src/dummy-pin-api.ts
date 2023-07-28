import { PinApi, PublishOpts } from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'

function warn(operation: string) {
  console.warn(`You use a deprecated ceramic.pin.${operation} API. Please, reconsider your choices`)
}

export class DummyPinApi implements PinApi {
  async add(): Promise<void> {
    warn(`add`)
    return
  }

  async ls(): Promise<AsyncIterable<string>> {
    warn(`ls`)
    return
  }

  async rm(streamId: StreamID, opts?: PublishOpts): Promise<void> {
    warn(`ls`)
    return
  }
}
