import { Interface } from '@ethersproject/abi'

export const ABI = [
  'function anchorDagCbor(bytes32)',
  'event DidAnchor(address indexed _service, bytes32 _root)',
]

export const contractInterface = new Interface(ABI)
