export type SupportedNetwork =
  | 'eip155:1' // mainnet
  | 'eip155:3' // ropsten
  | 'eip155:5' // goerli
  | 'eip155:100' // gnosis
  | 'eip155:1337' // ganache
  | 'eip155:11155111' // sepolia

export const BLOCK_THRESHHOLDS: Record<SupportedNetwork, number> = {
  'eip155:1': 1000000000,
  'eip155:3': 1000000000,
  'eip155:5': 1000000000,
  'eip155:100': 1000000000,
  'eip155:1337': 1000000,
  'eip155:11155111': 1000000000,
}

export const ANCHOR_CONTRACT_ADDRESS = '0x231055a0852d67c7107ad0d0dfeab60278fe6adc'

export const CONTRACT_TX_TYPE = 'f(bytes32)'
