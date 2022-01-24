import { StreamRef } from '../stream-ref.js'
import { StreamID } from '../stream-id.js'
import { CommitID } from '../commit-id.js'

describe('.build', () => {
  const STREAM_ID_STRING = 'kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s'
  const streamId = StreamID.fromString(STREAM_ID_STRING)
  const STREAM_ID_WITH_COMMIT =
    'k1dpgaqe3i64kjqcp801r3sn7ysi5i0k7nxvs7j351s7kewfzr3l7mdxnj7szwo4kr9mn2qki5nnj0cv836ythy1t1gya9s25cn1nexst3jxi5o3h6qprfyju'
  const commitId = CommitID.fromString(STREAM_ID_WITH_COMMIT)

  test('StreamID', () => {
    const result = StreamRef.from(streamId)
    expect(result).toBe(streamId)
  })
  test('valid StreamID string', () => {
    const result = StreamRef.from(STREAM_ID_STRING)
    expect(result).toBeInstanceOf(StreamID)
    expect(result).toEqual(streamId)
  })
  test('valid StreamID bytes', () => {
    const result = StreamRef.from(streamId.bytes)
    expect(result).toBeInstanceOf(StreamID)
    expect(result).toEqual(streamId)
  })
  test('CommitID', () => {
    const result = StreamRef.from(commitId)
    expect(result).toBeInstanceOf(CommitID)
    expect(result).toEqual(commitId)
  })
  test('valid CommitID string', () => {
    const result = StreamRef.from(STREAM_ID_WITH_COMMIT)
    expect(result).toBeInstanceOf(CommitID)
    expect(result).toEqual(commitId)
  })
  test('valid CommitID bytes', () => {
    const result = StreamRef.from(commitId.bytes)
    expect(result).toBeInstanceOf(CommitID)
    expect(result).toEqual(commitId)
  })
  test('invalid string', () => {
    expect(() => StreamRef.from('garbage')).toThrow()
  })
  test('invalid bytes', () => {
    expect(() => StreamRef.from(new Uint8Array([1, 2, 3]))).toThrow()
  })
})
