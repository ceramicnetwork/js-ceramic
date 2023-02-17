/**
 * A JSON object containing various diagnostic and introspection information from a running
 * Ceramic node.
 */
export interface NodeStatusResponse {
  /**
   * A random UUID that is generated each time a node starts up.  Can be used to detect when
   * a node restarts.
   */
  runId: string

  /**
   * How long the node has been running.
   */
  uptimeMs: number

  /**
   * The Ceramic network the node is connected to.
   */
  network: string

  /**
   * Anchoring-related information.
   */
  anchor: AnchorNodeStatus

  /**
   * Information about the connected IPFS node.
   */
  ipfs: IpfsNodeStatus
}

/**
 * IPFS sub-object within NodeStatusResponse
 */
export interface IpfsNodeStatus {
  /**
   * PeerId of the connected ipfs node
   */
  peerId: string

  /**
   * IPFS Swarm multiaddrs of the connected ipfs node
   */
  addresses: Array<string>
}

export interface AnchorNodeStatus {
  /**
   * The URL of the Ceramic Anchor Service used to request anchors.
   */
  anchorServiceUrl: string

  /**
   * The ethereum rpc endpoint used to validate anchor transactions. If null, likely means
   * the node is using the default, rate-limited ethereum provider.
   */
  ethereumRpcEndpoint: string | null

  /**
   * The ethereum chainId used for anchors.
   */
  chainId: string
}
