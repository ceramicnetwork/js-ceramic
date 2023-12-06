import { PinApi, PublishOpts, LoggerProvider } from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'

const logger = new LoggerProvider().getDiagnosticsLogger()

function warn(operation: string) {
  logger.warn(
    `You are using the ceramic.pin.${operation} API which has been removed and is now a no-op.  This operation will not have any affect.  If you want to change the pin state of streams please use the new ceramic.admin.pin API which requires a DID that has been granted admin access on the Ceramic node.`
  )
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
