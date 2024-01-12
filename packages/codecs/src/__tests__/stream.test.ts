import { CommitID, type StreamID } from '@ceramicnetwork/streamid'
import { describe, test, expect } from '@jest/globals'
import { validate, isRight, type Right } from 'codeco'

import { commitIdAsString, isStreamIdString, streamIdAsString, streamIdString } from '../stream.js'
import { BaseTestUtils as TestUtils } from '@ceramicnetwork/base-test-utils'

describe('isStreamIdString', () => {
  test('ok', () => {
    expect(isStreamIdString(TestUtils.randomStreamID().toString())).toBe(true)
  })
  test('not ok', () => {
    expect(isStreamIdString(TestUtils.randomCID().toString())).toBe(false)
  })
})

describe('streamIdString', () => {
  const streamId = TestUtils.randomStreamID().toString()
  test('decode: ok', () => {
    const result = validate(streamIdString, streamId)
    expect(isRight(result)).toEqual(true)
    expect((result as Right<StreamID>).right).toBe(streamId)
  })
  test('decode: not ok', () => {
    const result = validate(streamIdString, 'garbage')
    expect(isRight(result)).toEqual(false)
  })
  test('encode', () => {
    const result = streamIdString.encode(streamId)
    expect(result).toBe(streamId)
  })
})

describe('streamIdAsString', () => {
  const streamId = TestUtils.randomStreamID()
  test('decode: ok', () => {
    const result = validate(streamIdAsString, streamId.toString())
    expect(isRight(result)).toEqual(true)
    expect((result as Right<StreamID>).right).toEqual(streamId)
  })
  test('decode: not ok', () => {
    const result = validate(streamIdAsString, 'garbage')
    expect(isRight(result)).toEqual(false)
  })
  test('encode', () => {
    const result = streamIdAsString.encode(streamId)
    expect(result).toEqual(streamId.toString())
  })
})

describe('commitId', () => {
  const STREAM_ID_STRING = 'kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s'
  const COMMIT_ID_STRING =
    'k1dpgaqe3i64kjqcp801r3sn7ysi5i0k7nxvs7j351s7kewfzr3l7mdxnj7szwo4kr9mn2qki5nnj0cv836ythy1t1gya9s25cn1nexst3jxi5o3h6qprfyju'

  test('decode: ok', () => {
    const commitId = CommitID.fromString(COMMIT_ID_STRING)
    const result = validate(commitIdAsString, commitId.toString())
    expect(isRight(result)).toBeTruthy()
    const decoded = (result as Right<CommitID>).right
    expect(decoded).toBeInstanceOf(CommitID)
    expect(commitId.equals(decoded)).toBeTruthy()
  })
  test('decode: fail', () => {
    // @ts-ignore TS does not expect `null` as a parameter
    expect(isRight(validate(commitIdAsString, null))).toBeFalsy()
    // @ts-ignore TS does not expect `undefined` as a parameter
    expect(isRight(validate(commitIdAsString, undefined))).toBeFalsy()
    expect(isRight(validate(commitIdAsString, ''))).toBeFalsy()
    expect(isRight(validate(commitIdAsString, 'garbage'))).toBeFalsy()
    // StreamID
    expect(isRight(validate(commitIdAsString, STREAM_ID_STRING))).toBeFalsy()
  })
  test('encode', () => {
    const commitId = CommitID.fromString(COMMIT_ID_STRING)
    expect(commitIdAsString.encode(commitId)).toEqual(COMMIT_ID_STRING)
  })
})
