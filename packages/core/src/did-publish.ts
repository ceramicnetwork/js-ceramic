import {
  AnchorStatus,
  CeramicApi,
  CeramicCommit,
  CeramicSigner,
  CommitData,
  CommitHeader,
  CommitType,
  Context,
  CreateOpts,
  GenesisCommit,
  GenesisHeader,
  LoadOpts,
  RawCommit,
  SignatureStatus,
  SignedCommitContainer,
  Stream,
  StreamConstructor,
  StreamHandler,
  StreamMetadata,
  StreamState,
  StreamStatic,
  StreamUtils,
  SyncOptions,
  UpdateOpts,
} from '@ceramicnetwork/common'
import * as dagCbor from '@ipld/dag-cbor'
import * as Block from 'multiformats/block'
import { TileMetadataArgs } from '@ceramicnetwork/stream-tile'
import { CommitID, StreamID, StreamRef } from '@ceramicnetwork/streamid'
import { sha256 } from 'multiformats/hashes/sha2'
import { randomString } from '@stablelib/random'
import { CID } from 'multiformats/cid'
import cloneDeep from 'lodash.clonedeep'

const DEFAULT_CREATE_OPTS = { anchor: true, publish: true, sync: SyncOptions.PREFER_CACHE }
const DEFAULT_LOAD_OPTS = { sync: SyncOptions.PREFER_CACHE }
const DEFAULT_UPDATE_OPTS = { anchor: true, publish: true, throwOnInvalidCommit: true }

async function _ensureAuthenticated(signer: CeramicSigner) {
  if (signer.did == null) {
    throw new Error('No DID provided')
  }
  if (!signer.did.authenticated) {
    await signer.did.authenticate()
    signer.loggerProvider?.getDiagnosticsLogger().imp(`Now authenticated as DID ${signer.did.id}`)
  }
}

async function _signDagJWS(
  signer: CeramicSigner,
  commit: CeramicCommit
): Promise<SignedCommitContainer> {
  await _ensureAuthenticated(signer)
  return signer.did.createDagJWS(commit)
}

async function throwReadOnlyError(): Promise<void> {
  throw new Error(
    'Historical stream commits cannot be modified. Load the stream without specifying a commit to make updates.'
  )
}

function stringArraysEqual(arr1: Array<string>, arr2: Array<string>) {
  if (arr1.length != arr2.length) {
    return false
  }
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false
    }
  }
  return true
}

function headerFromMetadata(
  metadata: TileMetadataArgs | StreamMetadata | undefined,
  genesis: boolean
): CommitHeader {
  if (typeof metadata?.schema === 'string') {
    try {
      CommitID.fromString(metadata.schema)
    } catch {
      throw new Error('Schema must be a CommitID')
    }
  }

  const header: CommitHeader = {
    controllers: metadata?.controllers,
    family: metadata?.family,
    schema: metadata?.schema?.toString(),
    tags: metadata?.tags,
  }

  // Handle properties that can only be set on the genesis commit.
  if (genesis) {
    if (!metadata?.deterministic) {
      header.unique = randomString(16)
    }
    if (metadata?.forbidControllerChange) {
      header.forbidControllerChange = true
    }
  } else {
    // These throws aren't strictly necessary as we can just leave these fields out of the header
    // object we return, but throwing here gives more useful feedback to users.

    if (metadata?.deterministic !== undefined || (metadata as any)?.unique !== undefined) {
      throw new Error("Cannot change 'deterministic' or 'unique' properties on existing Streams")
    }

    if (metadata?.forbidControllerChange !== undefined) {
      throw new Error("Cannot change 'forbidControllerChange' property on existing Streams")
    }
  }

  // Delete undefined keys from header
  Object.keys(header).forEach((key) => header[key] === undefined && delete header[key])
  return header
}

@StreamStatic<StreamConstructor<DidPublishDocument>>()
export class DidPublishDocument<T = any> extends Stream {
  static STREAM_TYPE_NAME = 'did-publish'
  static STREAM_TYPE_ID = 2

  private _isReadOnly = false

  get content(): T {
    return super.content
  }

  static async create<T>(
    ceramic: CeramicApi,
    content: T | null | undefined,
    metadata?: TileMetadataArgs,
    opts: CreateOpts = {}
  ): Promise<DidPublishDocument<T>> {
    opts = { ...DEFAULT_CREATE_OPTS, ...opts }
    if (!metadata?.deterministic && opts.syncTimeoutSeconds == undefined) {
      // By default you don't want to wait to sync doc state from pubsub when creating a unique
      // document as there shouldn't be any existing state for this doc on the network.
      opts.syncTimeoutSeconds = 0
    }
    const commit = await DidPublishDocument.makeGenesis(ceramic, content, metadata)
    return ceramic.createStreamFromGenesis<DidPublishDocument<T>>(
      DidPublishDocument.STREAM_TYPE_ID,
      commit,
      opts
    )
  }

  static async createFromGenesis<T>(
    ceramic: CeramicApi,
    genesisCommit: GenesisCommit,
    opts: CreateOpts = {}
  ): Promise<DidPublishDocument<T>> {
    opts = { ...DEFAULT_CREATE_OPTS, ...opts }
    if (genesisCommit.header?.unique && opts.syncTimeoutSeconds == undefined) {
      // By default you don't want to wait to sync doc state from pubsub when creating a unique
      // document as there shouldn't be any existing state for this doc on the network.
      opts.syncTimeoutSeconds = 0
    }
    const commit = genesisCommit.data ? await _signDagJWS(ceramic, genesisCommit) : genesisCommit
    return ceramic.createStreamFromGenesis<DidPublishDocument<T>>(
      DidPublishDocument.STREAM_TYPE_ID,
      commit,
      opts
    )
  }

  static async load<T>(
    ceramic: CeramicApi,
    streamId: StreamID | CommitID | string,
    opts: LoadOpts = {}
  ): Promise<DidPublishDocument<T>> {
    opts = { ...DEFAULT_LOAD_OPTS, ...opts }
    const streamRef = StreamRef.from(streamId)
    if (streamRef.type != DidPublishDocument.STREAM_TYPE_ID) {
      throw new Error(
        `StreamID ${streamRef.toString()} does not refer to a '${
          DidPublishDocument.STREAM_TYPE_NAME
        }' stream, but to a ${streamRef.typeName}`
      )
    }

    return ceramic.loadStream<DidPublishDocument<T>>(streamRef, opts)
  }

  async update(
    content: T | null | undefined,
    metadata?: TileMetadataArgs,
    opts: UpdateOpts = {}
  ): Promise<void> {
    opts = { ...DEFAULT_UPDATE_OPTS, ...opts }
    const signer: CeramicSigner = opts.asDID ? { did: opts.asDID } : this.api
    const updateCommit = await this.makeCommit(signer, content, metadata)
    const updated = await this.api.applyCommit(this.id, updateCommit, opts)
    this.state$.next(updated.state)
  }

  makeReadOnly() {
    this.update = throwReadOnlyError
    this.sync = throwReadOnlyError
    this._isReadOnly = true
  }

  get isReadOnly(): boolean {
    return this._isReadOnly
  }

  async makeCommit(
    signer: CeramicSigner,
    newContent: T | null | undefined,
    newMetadata?: TileMetadataArgs
  ): Promise<CeramicCommit> {
    const header = headerFromMetadata(newMetadata, false)

    if (header.controllers && header.controllers?.length !== 1) {
      throw new Error('Exactly one controller must be specified')
    }

    if (newContent == null) {
      newContent = this.content
    }

    const block = await Block.encode({ value: newContent, codec: dagCbor, hasher: sha256 })
    const cid = block.cid

    const commit: RawCommit = {
      header,
      data: cid,
      prev: this.tip,
      id: this.state.log[0].cid,
    }
    return _signDagJWS(signer, commit)
  }

  static async makeGenesis<T>(
    signer: CeramicSigner,
    content: T | null | undefined,
    metadata?: TileMetadataArgs
  ): Promise<CeramicCommit> {
    if (!metadata) {
      metadata = {}
    }

    if (!metadata.controllers || metadata.controllers.length === 0) {
      if (signer.did) {
        await _ensureAuthenticated(signer)
        metadata.controllers = [signer.did.id]
      } else {
        throw new Error('No controllers specified')
      }
    }
    if (metadata.controllers?.length !== 1) {
      throw new Error('Exactly one controller must be specified')
    }

    const header: GenesisHeader = headerFromMetadata(metadata, true)
    if (metadata?.deterministic && content) {
      throw new Error('Initial content must be null when creating a deterministic Tile document')
    }

    if (content == null) {
      const result = { header }
      // Check if we can encode it in cbor. Should throw an error when invalid payload.
      dagCbor.encode(result)
      // No signature needed if no genesis content
      return result
    }
    const block = await Block.encode({ value: content, codec: dagCbor, hasher: sha256 })
    const cid = block.cid
    const commit: GenesisCommit = { data: cid, header }
    return _signDagJWS(signer, commit)
  }
}

export class DidPublishDocumentHandler implements StreamHandler<DidPublishDocument> {
  get type(): number {
    return DidPublishDocument.STREAM_TYPE_ID
  }

  get name(): string {
    return DidPublishDocument.STREAM_TYPE_NAME
  }

  get stream_constructor(): StreamConstructor<DidPublishDocument> {
    return DidPublishDocument
  }

  applyCommit(commitData: CommitData, context: Context, state?: StreamState): Promise<StreamState> {
    if (state == null) {
      // apply genesis
      return this._applyGenesis(commitData, context)
    }

    if (StreamUtils.isAnchorCommitData(commitData)) {
      return this._applyAnchor(context, commitData, state)
    }

    return this._applySigned(commitData, state, context)
  }

  async _applyGenesis(commitData: CommitData, context: Context): Promise<StreamState> {
    const payload = commitData.commit
    const isSigned = StreamUtils.isSignedCommitData(commitData)
    if (isSigned) {
      await this._verifySignature(commitData, context, payload.header.controllers[0])
    } else if (payload.data) {
      throw Error('Genesis commit with contents should always be signed')
    }

    if (!(payload.header.controllers && payload.header.controllers.length === 1)) {
      throw new Error('Exactly one controller must be specified')
    }

    const contentCid = payload.data as CID
    const data = await context.ipfs.dag.get(contentCid).then((r) => r.value)

    return {
      type: DidPublishDocument.STREAM_TYPE_ID,
      content: data,
      metadata: payload.header,
      signature: isSigned ? SignatureStatus.SIGNED : SignatureStatus.GENESIS,
      anchorStatus: AnchorStatus.NOT_REQUESTED,
      log: [{ cid: commitData.cid, type: CommitType.GENESIS }],
    }
  }

  async _applyAnchor(
    context: Context,
    commitData: CommitData,
    state: StreamState
  ): Promise<StreamState> {
    // TODO: Assert that the 'prev' of the commit being applied is the end of the log in 'state'
    const proof = commitData.proof
    state.log.push({
      cid: commitData.cid,
      type: CommitType.ANCHOR,
      timestamp: proof.blockTimestamp,
    })
    let content = state.content
    let metadata = state.metadata

    if (state.next?.content) {
      content = state.next.content
      delete state.next.content
    }

    if (state.next?.metadata) {
      metadata = state.next.metadata
      delete state.next.metadata
    }

    delete state.next
    delete state.anchorScheduledFor

    return {
      ...state,
      content,
      metadata,
      anchorStatus: AnchorStatus.ANCHORED,
      anchorProof: proof,
    }
  }

  async _applySigned(
    commitData: CommitData,
    state: StreamState,
    context: Context
  ): Promise<StreamState> {
    // TODO: Assert that the 'prev' of the commit being applied is the end of the log in 'state'
    const controller = state.next?.metadata?.controllers?.[0] || state.metadata.controllers[0]

    // Verify the signature first
    await this._verifySignature(commitData, context, controller)

    // Retrieve the payload
    const payload = commitData.commit

    if (!payload.id.equals(state.log[0].cid)) {
      throw new Error(`Invalid streamId ${payload.id}, expected ${state.log[0].cid}`)
    }

    if (payload.header.controllers && payload.header.controllers.length !== 1) {
      throw new Error('Exactly one controller must be specified')
    }

    if (
      state.metadata.forbidControllerChange &&
      payload.header.controllers &&
      !stringArraysEqual(payload.header.controllers, state.metadata.controllers)
    ) {
      const streamId = new StreamID(DidPublishDocument.STREAM_TYPE_ID, state.log[0].cid)
      throw new Error(
        `Cannot change controllers since 'forbidControllerChange' is set. Tried to change controllers for Stream ${streamId} from ${JSON.stringify(
          state.metadata.controllers
        )} to ${payload.header.controllers}`
      )
    }

    if (
      payload.header.forbidControllerChange !== undefined &&
      payload.header.forbidControllerChange !== state.metadata.forbidControllerChange
    ) {
      throw new Error("Changing 'forbidControllerChange' metadata property is not allowed")
    }

    const nextState = cloneDeep(state)

    nextState.signature = SignatureStatus.SIGNED
    nextState.anchorStatus = AnchorStatus.NOT_REQUESTED

    nextState.log.push({ cid: commitData.cid, type: CommitType.SIGNED })

    const data = await context.ipfs.dag.get(payload.data as CID).then((r) => r.value)

    const metadata = state.next?.metadata ?? state.metadata
    nextState.next = {
      content: data,
      metadata: { ...metadata, ...payload.header },
    }
    return nextState
  }

  async _verifySignature(
    commitData: CommitData,
    context: Context,
    controller: string
  ): Promise<void> {
    await context.did.verifyJWS(commitData.envelope, {
      atTime: commitData.timestamp,
      issuer: controller,
      disableTimecheck: commitData.disableTimecheck,
    })
  }
}
