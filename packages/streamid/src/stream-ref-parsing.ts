import { readCid, readVarint } from './reading-bytes.js'
import { STREAMID_CODEC } from './constants.js'
import { CID } from 'multiformats/cid'
import { base36 } from 'multiformats/bases/base36'

export type StreamIDComponents = {
  kind: 'stream-id'
  type: number
  genesis: CID
}

export type CommitIDComponents = {
  kind: 'commit-id'
  type: number
  genesis: CID
  commit: CID | null
}

export type StreamRefComponents = StreamIDComponents | CommitIDComponents

/**
 * Parse StreamID or CommitID from bytes.
 */
export function fromBytes(input: Uint8Array, title = 'StreamRef'): StreamRefComponents {
  const [streamCodec, streamCodecRemainder] = readVarint(input)
  if (streamCodec !== STREAMID_CODEC)
    throw new Error(`Invalid ${title}, does not include streamid codec`)
  const [type, streamtypeRemainder] = readVarint(streamCodecRemainder)
  const cidResult = readCid(streamtypeRemainder)
  const [genesis, genesisRemainder] = cidResult
  if (genesisRemainder.length === 0) {
    return {
      kind: 'stream-id',
      type: type,
      genesis: genesis,
    }
  } else if (genesisRemainder.length === 1 && genesisRemainder[0] === 0) {
    // Zero commit
    return {
      kind: 'commit-id',
      type: type,
      genesis: genesis,
      commit: null,
    }
  } else {
    // Commit
    const [commit] = readCid(genesisRemainder)
    return {
      kind: 'commit-id',
      type: type,
      genesis: genesis,
      commit: commit,
    }
  }
}

/**
 * RegExp to match against URL representation of StreamID or CommitID.
 */
const URL_PATTERN = /(ceramic:\/\/|\/ceramic\/)?([a-zA-Z0-9]+)(\?commit=([a-zA-Z0-9]+))?/

export function fromString(input: string, title = 'StreamRef'): StreamRefComponents {
  const protocolMatch = URL_PATTERN.exec(input) || []
  const base = protocolMatch[2]
  if (!base) throw new Error(`Malformed ${title} string: ${input}`)
  const bytes = base36.decode(base)
  const streamRef = fromBytes(bytes)
  const commit = protocolMatch[4]
  if (commit) {
    return {
      kind: 'commit-id',
      type: streamRef.type,
      genesis: streamRef.genesis,
      commit: parseCommit(streamRef.genesis, commit),
    }
  }
  return streamRef
}

/**
 * Safely parse CID, be it CID instance or a string representation.
 * Return `undefined` if not CID.
 *
 * @param input - CID or string.
 */
export function parseCID(input: any): CID | null {
  try {
    return typeof input === 'string' ? CID.parse(input) : CID.asCID(input)
  } catch {
    return null
  }
}

/**
 * Parse commit CID from string or number.
 * `null` result indicates genesis commit.
 * If `commit` is 0, `'0'`, `null` or is equal to `genesis` CID, result is `null`.
 * Otherwise, return commit as proper CID.
 *
 * @param genesis - genesis CID for stream
 * @param commit - representation of commit, be it CID, 0, `'0'`, `null`
 */
export function parseCommit(genesis: CID, commit: CID | string | number | null = null): CID | null {
  if (!commit) return null // Handle number 0, null and undefined
  if (commit === '0') return null // Handle string 0

  const commitCID = parseCID(commit)
  if (commitCID) {
    // CID-like
    if (genesis.equals(commitCID)) {
      return null
    } else {
      return commitCID
    }
  } else {
    throw new Error(
      'Cannot specify commit as a number except to request commit 0 (the genesis commit)'
    )
  }
}
