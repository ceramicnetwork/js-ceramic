import { CAR } from 'cartonne'
import { StreamID } from '@ceramicnetwork/streamid'
import { Memoize } from 'mapmoize'
import type { CID } from 'multiformats/cid'
import { GenesisCommit } from '@ceramicnetwork/common'

export class AnchorRequestCarFileReader {
  constructor(readonly carFile: CAR) {}

  @Memoize()
  get genesis(): GenesisCommit {
    return this.carFile.get(this.streamId.cid)
  }

  @Memoize()
  private get root(): Record<string, any> {
    const rootCid = this.carFile.roots[0]
    return this.carFile.get(rootCid)
  }

  @Memoize()
  get timestamp(): Date {
    return new Date(this.root.timestamp)
  }

  @Memoize()
  get streamId(): StreamID {
    return StreamID.fromBytes(this.root.streamId)
  }

  @Memoize()
  get tip(): CID {
    return this.root.tip
  }
}
