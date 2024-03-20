export type SupportedNetwork =
  | 'eip155:1' // mainnet
  | 'eip155:3' // ropsten
  | 'eip155:5' // goerli
  | 'eip155:100' // gnosis
  | 'eip155:1337' // ganache
  | 'eip155:11155111' // sepolia

export const ANCHOR_CONTRACT_ADDRESS = '0x231055a0852d67c7107ad0d0dfeab60278fe6adc'

export const CONTRACT_TX_TYPE = 'f(bytes32)'
