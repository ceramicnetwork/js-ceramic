import { jest } from '@jest/globals'
import { TestUtils } from '@ceramicnetwork/common'
import { CID } from 'multiformats/cid'
import { RebuildAnchorWorker } from '../rebuild-anchor.js'
import { IpfsService, RebuildAnchorJobData } from '../../interfaces.js'
import { StreamID } from '@ceramicnetwork/streamid'
import { default as PgBoss } from 'pg-boss'
import { convertEthHashToCid } from '@ceramicnetwork/anchor-utils'

const ROOT_CID = 'bafyreie44gklj64ldakdfwfytho74sarfagfpccdf3wgkuf6dgjugrmlde'
const ANCHOR_PROOF = {
  root: CID.parse(ROOT_CID),
  chainId: 'eip155:5',
  txHash: convertEthHashToCid('0xed6b5d7a9e8b3890651f7f0d8ed9b8939e9857cdd0b48bf77917cd709ddf7afc'),
}

const MODEL = 'kjzl6hvfrbw6c8c48hg1u62lhnc95g4ntslc861i5feo7tev0fyh9mvsbjtw374'

const STREAM_USING_MODEL1 = 'kjzl6kcym7w8y5hi5n1rty3mqey8xgo0efn5cnzhkwziixqkcl4dup6pgux03e2'
const COMMIT_USING_MODEL1 = 'bagcqcerada2vcxipsls7qprmgk66dnlo3jjdh6qyjmxnr3vcs7tianb4jiva'

const STREAM_USING_MODEL2 = 'kjzl6kcym7w8ya713xj0mtxf1och8jx6uloqff0r8hczotabjul3f0r7rneq9zf'
const COMMIT_USING_MODEL2 = 'bagcqcera2usv3x7qjmdv63dhwt25plsvs2etqntujpbkf54dvee6z5zdv4fq'

// Based on data found in a real anchor
const MOCK_MERKLE_TREE = {
  [ROOT_CID]: [
    'bafyreib447movc4d6xewcyowv7l32dymsxzjd62kexvt6chyeuemg64xuy',
    'bafyreihuqlmgtno7xiinrsfh43idw55rdqeh4ahm2ebhdojx6t3j6g2d74',
    'bafyreihnkt4mepop3zg77srzeur4ysfyeh2nnqkgt2l6d3xu76tix6f5hi',
  ],
  // MODEL COMMITS
  bafyreib447movc4d6xewcyowv7l32dymsxzjd62kexvt6chyeuemg64xuy: [
    COMMIT_USING_MODEL1,
    COMMIT_USING_MODEL2,
  ],
  bafyreihuqlmgtno7xiinrsfh43idw55rdqeh4ahm2ebhdojx6t3j6g2d74: [
    'bafyreig73vmvfaz47c4dpgoesrcy3rpw4qndpiqofvlrj7wnjsdrfqop3a', // 0/0
    'bafyreicf3iuxrnivvvwksrq2ghq4mbmnddtujdiohyjweceaga3efwdrf4', // 0/1
  ],
  bafyreihnkt4mepop3zg77srzeur4ysfyeh2nnqkgt2l6d3xu76tix6f5hi: {
    streamIds: [
      STREAM_USING_MODEL1,
      STREAM_USING_MODEL2,
      'kjzl6cwe1jw149b1nvdrkcrm50kqz24ghhkkvrh8xeglkm2w7q0bdrclqodcgw2',
      'kjzl6cwe1jw145nizz90qow3jygfhziwfalo3ig6to1dkz6qhwmro1mjk5idci1',
    ],
    numEntries: 4,
  },
  bagcqcerada2vcxipsls7qprmgk66dnlo3jjdh6qyjmxnr3vcs7tianb4jiva: {
    link: 'bafyreih5twvhkmyuftw2lj7jgz7dxk2ltgyviyrzxja25gikj77kpzfn7a',
  },

  bafyreih5twvhkmyuftw2lj7jgz7dxk2ltgyviyrzxja25gikj77kpzfn7a: {
    data: { data: 444 },
    header: {
      model: StreamID.fromString(MODEL).bytes,
    },
  },

  bagcqcera2usv3x7qjmdv63dhwt25plsvs2etqntujpbkf54dvee6z5zdv4fq: {
    link: 'bafyreiesfdcdu7w5hfuf2k65m4d4tvpehzw5dnzyr4lmqns3wctwm6orc4',
  },

  bafyreiesfdcdu7w5hfuf2k65m4d4tvpehzw5dnzyr4lmqns3wctwm6orc4: {
    data: { data: 333 },
    header: {
      model: StreamID.fromString('kjzl6cwe1jw146eh68syta5ihktzur5gksfuqmgcieb7wyn4gq7aw1kvidvjjqu')
        .bytes,
    },
  },
}

const mockRetreiveFromIpfs = async (cid: CID | string, path?: string) => {
  if (!MOCK_MERKLE_TREE[cid.toString()]) {
    return {}
  }

  const splitPath = path && path.length > 0 ? path.split('/') : []

  let data = MOCK_MERKLE_TREE[cid.toString()]
  for (const direction of splitPath) {
    const cid = data[direction]
    data = MOCK_MERKLE_TREE[cid]

    if (!data) {
      return {}
    }
  }

  return data
}

const MOCK_IPFS_SERVICE: IpfsService = {
  retrieveFromIPFS: jest.fn(mockRetreiveFromIpfs),

  storeRecord: jest.fn((record: Record<string, unknown>) => Promise.resolve(TestUtils.randomCID())),

  storeCommit: jest.fn((data: any, streamId?: StreamID) => Promise.resolve(TestUtils.randomCID())),

  retrieveCommit: jest.fn((cid: CID | string, streamId: StreamID) => mockRetreiveFromIpfs(cid)),
}

describe('Rebuild Anchor Commits Worker', () => {
  jest.setTimeout(60000)

  const mockHandleCommit = jest.fn(() => Promise.resolve())

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('Successfully recreates anchor commits for mids that use models we are interested in ', async () => {
    const data: RebuildAnchorJobData = {
      root: ANCHOR_PROOF.root.toString(),
      chainId: ANCHOR_PROOF.chainId,
      txHash: ANCHOR_PROOF.txHash.toString(),
      models: [MODEL],
    }

    const job: PgBoss.Job = {
      id: '1',
      name: 'test',
      data,
    }

    const worker: RebuildAnchorWorker = new RebuildAnchorWorker(MOCK_IPFS_SERVICE, mockHandleCommit)
    await worker.handler(job)

    expect(MOCK_IPFS_SERVICE.storeRecord).toBeCalledTimes(1)
    expect(MOCK_IPFS_SERVICE.storeRecord).toHaveBeenCalledWith(ANCHOR_PROOF)
    const proofCid = await MOCK_IPFS_SERVICE.storeRecord.mock.results[0].value

    expect(MOCK_IPFS_SERVICE.retrieveFromIPFS).toBeCalledTimes(2)
    expect(MOCK_IPFS_SERVICE.retrieveFromIPFS).toHaveBeenCalledWith(CID.parse(ROOT_CID), '2')
    expect(MOCK_IPFS_SERVICE.retrieveFromIPFS).toHaveBeenCalledWith(CID.parse(ROOT_CID), '0')

    expect(MOCK_IPFS_SERVICE.retrieveCommit).toBeCalledTimes(8)

    expect(MOCK_IPFS_SERVICE.storeCommit).toBeCalledTimes(1)
    expect(MOCK_IPFS_SERVICE.storeCommit).toHaveBeenCalledWith({
      id: StreamID.fromString(STREAM_USING_MODEL1).cid,
      prev: COMMIT_USING_MODEL1,
      proof: proofCid,
      path: '0/0',
    })
  })
})
