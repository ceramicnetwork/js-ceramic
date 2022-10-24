import benchmark from 'benchmark'
import { TestUtils } from '@ceramicnetwork/common'
import * as present from './index.js'
import * as old from '../../../node_modules/@ceramicnetwork/streamid/lib/index.js'

const suite = new benchmark.Suite()

function formatNumber(number: number) {
  return String(number).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}

suite
  .add('old.StreamId.fromString', () => {
    const streamId = new old.StreamID(1, TestUtils.randomCID())
    old.StreamID.fromString(streamId.toString())
  })
  .add('present.StreamId.fromString', () => {
    const streamId = new present.StreamID(1, TestUtils.randomCID())
    present.StreamID.fromString(streamId.toString())
  })
  .add('old.StreamId.fromBytes', () => {
    const streamId = new old.StreamID(1, TestUtils.randomCID())
    old.StreamID.fromBytes(streamId.bytes)
  })
  .add('present.StreamId.fromBytes', () => {
    const streamId = new present.StreamID(1, TestUtils.randomCID())
    present.StreamID.fromBytes(streamId.bytes)
  })
  .add('old.CommitID.fromString', () => {
    const commitID = new old.CommitID(1, TestUtils.randomCID(), TestUtils.randomCID())
    old.CommitID.fromString(commitID.toString())
  })
  .add('present.CommitID.fromString', () => {
    const commitID = new present.CommitID(1, TestUtils.randomCID(), TestUtils.randomCID())
    present.CommitID.fromString(commitID.toString())
  })
  .add('old.CommitID.fromBytes', () => {
    const commitID = new old.CommitID(1, TestUtils.randomCID(), TestUtils.randomCID())
    old.CommitID.fromBytes(commitID.bytes)
  })
  .add('present.CommitID.fromBytes', () => {
    const commitID = new present.CommitID(1, TestUtils.randomCID(), TestUtils.randomCID())
    present.CommitID.fromBytes(commitID.bytes)
  })
  .on('cycle', (event: any) => {
    const name = event.target.name.padEnd('emit  '.length)
    const hz = formatNumber(event.target.hz.toFixed(0)).padStart(9)
    process.stdout.write(`${name}${hz} ops/sec\n`)
  })
  .on('error', (event: any) => {
    process.stderr.write(event.target.error.toString() + '\n')
    process.exit(1)
  })
  .run()
