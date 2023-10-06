import { StreamID } from '@ceramicnetwork/streamid'
import { CAR, CARFactory } from 'cartonne'
import { CID } from 'multiformats/cid'

export const FAKE_STREAM_ID = StreamID.fromString(
  'kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s'
)
export const FAKE_TIP_CID = CID.parse('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')

const carFactory = new CARFactory()

export function generateFakeCarFile(): CAR {
  const car = carFactory.build()

  // Root block
  const timestampISO = new Date().toISOString()
  const genesis = car.put({ a: Math.floor(Math.random() * 1000) })
  car.put(
    {
      timestamp: timestampISO,
      streamId: new StreamID(1, genesis).bytes,
      tip: FAKE_TIP_CID,
    },
    { isRoot: true }
  )

  // Not adding any other blocks to the CAR file, because they're not needed for the test to pass

  return car
}
