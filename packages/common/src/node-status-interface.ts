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

  composeDB: ComposeDBStatus
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

/**
  * Status about the ComposeDB specific operations of the node.
  */
export interface ComposeDBStatus {
  /**
    * The list of models Ids that are being indexed.
    */
  indexedModels: Array<string>
  /**
    * The set of active sync operations.
    */
  syncs: SyncStatus
}

export interface SyncStatus {
  activeSyncs: Array<ActiveSyncStatus>
  continuousSync: Array<ContinuousSyncStatus>
  pendingSyncs: Array<PendingSyncStatus>
}

// TODO (CDB-2106): move to SyncStatus Class
export interface ActiveSyncStatus {
  // The block the sync starts at
  startBlock: number
  // The block the sync is currently processing
  currentBlock: number
  // The block the sync will end on
  endBlock: number
  // Models that are being synced
  models: Array<string>
  // Date when the sync was requested
  createdAt: Date
  // Date when the sync started
  startedAt: Date
}
export interface ContinuousSyncStatus {
  // The first block recevied form the chain on node startup
  startBlock: number
  // The latest block received from the chain
  latestBlock: number
  // The number of blocks we wait for before we process a block
  confirmations: number
  // The block we are currently processing (should be latestBlock - confirmations)
  currentBlock: number
  // Models that are being synced
  models: Array<string>
}
export interface PendingSyncStatus {
  // The block the sync starts at
  startBlock: number
  // The block the sync will end on
  endBlock: number
  // Models that are being synced
  models: Array<string>
  // Date when the sync was requested
  createdAt: Date
}
