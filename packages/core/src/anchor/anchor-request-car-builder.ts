import type { Dispatcher } from '../dispatcher.js'
import { CARFactory, type CAR } from 'cartonne'
import * as DAG_JOSE from 'dag-jose'
import type { StreamID } from '@ceramicnetwork/streamid'
import type { CID } from 'multiformats/cid'
import { StreamUtils } from '@ceramicnetwork/common'

const CAR_FACTORY = new CARFactory()
CAR_FACTORY.codecs.add(DAG_JOSE)

export class AnchorRequestCarBuilder {
  constructor(private readonly dispatcher: Dispatcher) {}

  async build(streamId: StreamID, tip: CID): Promise<CAR> {
    const car = CAR_FACTORY.build()

    // Root block
    const timestampISO = new Date().toISOString()
    car.put(
      {
        timestamp: timestampISO,
        streamId: streamId.bytes,
        tip: tip,
      },
      { isRoot: true }
    )

    // Genesis block
    const genesisCid = streamId.cid
    car.blocks.put(await this.dispatcher.getIpfsBlock(genesisCid))

    // Tip block
    car.blocks.put(await this.dispatcher.getIpfsBlock(tip))

    // Genesis Link Block
    const genesisCommit = car.get(genesisCid)
    if (StreamUtils.isSignedCommit(genesisCommit)) {
      car.blocks.put(await this.dispatcher.getIpfsBlock(genesisCommit.link))
    }

    // Tip Link Block
    const tipCommit = car.get(tip)
    if (StreamUtils.isSignedCommit(tipCommit)) {
      car.blocks.put(await this.dispatcher.getIpfsBlock(tipCommit.link))
      // Tip CACAO Block
      const tipCacaoCid = StreamUtils.getCacaoCidFromCommit(tipCommit)
      if (tipCacaoCid) {
        car.blocks.put(await this.dispatcher.getIpfsBlock(tipCacaoCid))
      }
    }

    return car
  }
}
