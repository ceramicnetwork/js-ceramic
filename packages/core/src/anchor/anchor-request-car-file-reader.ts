import { CAR } from 'cartonne'
import { StreamID } from '@ceramicnetwork/streamid'
import { toCID } from '@ceramicnetwork/common'
import type { CID } from 'multiformats/cid'

export class AnchorRequestCarFileReader {
  constructor(readonly carFile: CAR) {}

  private get root(): Record<string, any> {
    const rootCid = this.carFile.roots[0]
    return this.carFile.get(rootCid)
  }

  get timestamp(): Date {
    return new Date(this.root.timestamp)
  }

  get streamId(): StreamID {
    return StreamID.fromBytes(this.root.streamId)
  }

  get tip(): CID {
    return toCID(this.root.tip)
  }
}
