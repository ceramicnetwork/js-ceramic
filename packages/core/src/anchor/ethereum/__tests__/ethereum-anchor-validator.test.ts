import { jest } from '@jest/globals'
import { LoggerProvider, AnchorValidator, AnchorProof } from '@ceramicnetwork/common'
import { CID } from 'multiformats'
import { decode } from 'multiformats/hashes/digest'
import * as uint8arrays from 'uint8arrays'

const TEST_CHAIN_ID = '1337'
const ANCHOR_PROOF: AnchorProof = {
  chainId: `eip155:${TEST_CHAIN_ID}`,
  blockNumber: 3,
  blockTimestamp: 1586784008,
  txHash: CID.parse('bagjqcgza7mvdlzewbfbq35peso2atjydg3ekalew5vmze7w2a5cbhmav4rmq'),
  root: CID.parse('bafyreic5p7grucmzx363ayxgoywb6d4qf5zjxgbqjixpkokbf5jtmdj5ni'),
  version: 1,
}
const TX_HASH =
  '0x' + uint8arrays.toString(decode(ANCHOR_PROOF.txHash.multihash.bytes).digest, 'base16')
const TEST_TRANSACTION = {
  data: '0x97ad09eb5d7fcd1a0999befdb062e6762c1f0f902f729b98304a2ef539412f53360d3d6a',
  blockNumber: ANCHOR_PROOF.blockNumber,
  blockHash: '0x752fcd3593c140db9f206b421c47d875e0f92e425983f8c72ab04c0e969b072a',
  to: '0xD3f84Cf6Be3DD0EB16dC89c972f7a27B441A39f2',
}

const MockJsonRpcProvider = {
  getTransaction: null,
  getNetwork: null,
  getBlock: null,

  reset() {
    this.getTransaction = jest.fn((txHash) => {
      expect(txHash).toEqual(TX_HASH)
      return Promise.resolve(TEST_TRANSACTION)
    })
    this.getNetwork = jest.fn(() => {
      return Promise.resolve({
        chainId: TEST_CHAIN_ID,
      })
    })
    this.getBlock = jest.fn(() => {
      return Promise.resolve({
        timestamp: ANCHOR_PROOF.blockTimestamp,
      })
    })
  },
}

jest.unstable_mockModule('@ethersproject/providers', () => {
  const originalModule = jest.requireActual('@ethersproject/providers') as any

  return {
    ...originalModule,
    StaticJsonRpcProvider: class {
      constructor() {
        MockJsonRpcProvider.reset()
        return MockJsonRpcProvider
      }
    },
  }
})

describe('EthereumAnchorValidator Test', () => {
  const loggerProvider = new LoggerProvider()
  const logger = loggerProvider.getDiagnosticsLogger()

  describe('validateChainInclusion', () => {
    let ethAnchorValidator: AnchorValidator

    beforeEach(async () => {
      const { EthereumAnchorValidator } = await import('../ethereum-anchor-validator.js')
      ethAnchorValidator = new EthereumAnchorValidator('https://test.com', logger)
      await ethAnchorValidator.init(`eip155:${TEST_CHAIN_ID}`)
    })

    describe('v1', () => {
      test('can validate an anchor proof created through the smart contract', async () => {
        await ethAnchorValidator.validateChainInclusion(ANCHOR_PROOF)
      })

      test('throws if not from correct contract address', async () => {
        MockJsonRpcProvider.getTransaction = jest.fn(() => {
          return Promise.resolve(
            Object.assign({}, TEST_TRANSACTION, {
              to: '0xc2Ca3c25E44a96Ea78708009AA459F7901F8De4d',
            })
          )
        }) as any

        await expect(ethAnchorValidator.validateChainInclusion(ANCHOR_PROOF)).rejects.toThrowError(
          'This is not the official anchoring contract address'
        )
      })
    })
  })
})
