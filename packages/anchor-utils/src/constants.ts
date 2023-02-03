export type SupportedNetwork =
  | 'eip155:1' // mainnet
  | 'eip155:3' // ropsten
  | 'eip155:5' // goerli
  | 'eip155:100' // gnosis
  | 'eip155:1337' // ganache

export const BLOCK_THRESHHOLDS: Record<SupportedNetwork, number> = {
  'eip155:1': 1000000000,
  'eip155:3': 1000000000,
  'eip155:5': 1000000000,
  'eip155:100': 1000000000,
  'eip155:1337': 1000000,
}

export const ANCHOR_CONTRACT_ADDRESSES: Record<SupportedNetwork, string> = {
  'eip155:1': '0xD3f84Cf6Be3DD0EB16dC89c972f7a27B441A39f2',
  'eip155:3': '0xD3f84Cf6Be3DD0EB16dC89c972f7a27B441A39f2',
  'eip155:5': '0xD3f84Cf6Be3DD0EB16dC89c972f7a27B441A39f2',
  'eip155:100': '0xD3f84Cf6Be3DD0EB16dC89c972f7a27B441A39f2',
  'eip155:1337': '0xD3f84Cf6Be3DD0EB16dC89c972f7a27B441A39f2',
}

export const CONTRACT_TX_TYPE = 'f(bytes32)'
