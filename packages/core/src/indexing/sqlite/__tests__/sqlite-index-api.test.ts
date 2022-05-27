import { jest } from '@jest/globals'
import tmp from 'tmp-promise'
import { DataSource } from 'typeorm'
import { asTimestamp, SqliteIndexApi, UnavailablePlaceholderError } from '../sqlite-index-api.js'
import { StreamID } from '@ceramicnetwork/streamid'
import { listMidTables } from '../init-tables.js'
import { IndexStreamArgs } from '../../types.js'
import csv from 'csv-parser'
import * as fs from 'fs'
import knex, { Knex } from 'knex'

const STREAM_ID_A = 'kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd'
const STREAM_ID_B = 'k2t6wyfsu4pfzxkvkqs4sxhgk2vy60icvko3jngl56qzmdewud4lscf5p93wna'
const CONTROLLER = 'did:key:foo'
const MODELS_TO_INDEX = [StreamID.fromString(STREAM_ID_A)]
const MODEL = MODELS_TO_INDEX[0]

let tmpFolder: tmp.DirectoryResult
let dataSource: DataSource
let konnection: Knex

beforeEach(async () => {
  tmpFolder = await tmp.dir({ unsafeCleanup: true })
  dataSource = new DataSource({
    type: 'sqlite',
    database: `${tmpFolder.path}/tmp-ceramic.sqlite`,
  })
  await dataSource.initialize()
  konnection = knex({
    client: 'sqlite3',
    useNullAsDefault: true,
    connection: {
      filename: `${tmpFolder.path}/tmp-ceramic.sqlite`,
    },
  })
})

afterEach(async () => {
  await dataSource.close()
  // await tmpFolder.cleanup()
})

describe('init', () => {
  test('initialize DataSource', async () => {
    const dataSource = new DataSource({
      type: 'sqlite',
      database: `${tmpFolder.path}/tmp-ceramic.sqlite`,
    })
    const initializeSpy = jest.spyOn(dataSource, 'initialize')
    const indexApi = new SqliteIndexApi(dataSource, konnection, [])
    await indexApi.init()
    expect(initializeSpy).toBeCalledTimes(1)
  })
  describe('create tables', () => {
    test('create new table from scratch', async () => {
      const modelsToIndex = [StreamID.fromString(STREAM_ID_A)]
      const indexApi = new SqliteIndexApi(dataSource, konnection, modelsToIndex)
      await indexApi.init()
      const created = await listMidTables(dataSource)
      const tableNames = modelsToIndex.map((m) => `mid_${m.toString()}`)
      expect(created).toEqual(tableNames)
    })

    test('create new table with existing ones', async () => {
      // First init with one model
      const modelsA = [StreamID.fromString(STREAM_ID_A)]
      const indexApiA = new SqliteIndexApi(dataSource, konnection, modelsA)
      await indexApiA.init()
      const createdA = await listMidTables(dataSource)
      const tableNamesA = modelsA.map((m) => `mid_${m.toString()}`)
      expect(createdA).toEqual(tableNamesA)

      // Next add another one
      const modelsB = [...modelsA, StreamID.fromString(STREAM_ID_B)]
      const indexApiB = new SqliteIndexApi(dataSource, konnection, modelsB)
      await indexApiB.init()
      const createdB = await listMidTables(dataSource)
      const tableNamesB = modelsB.map((m) => `mid_${m.toString()}`)
      expect(createdB).toEqual(tableNamesB)
    })
  })
})

/**
 * Difference between `a` and `b` timestamps is less than or equal to `deltaS`.
 */
function closeDates(a: Date, b: Date, deltaS = 1) {
  const aSeconds = asTimestamp(a)
  const bSeconds = asTimestamp(b)
  return Math.abs(aSeconds - bSeconds) <= deltaS
}

describe('indexStream', () => {
  const MODELS_TO_INDEX = [STREAM_ID_A, STREAM_ID_B].map(StreamID.fromString)
  const STREAM_CONTENT = {
    model: MODELS_TO_INDEX[0],
    streamID: StreamID.fromString(STREAM_ID_B),
    controller: CONTROLLER,
    lastAnchor: null,
  }

  let indexApi: SqliteIndexApi
  beforeEach(async () => {
    indexApi = new SqliteIndexApi(dataSource, konnection, MODELS_TO_INDEX)
    await indexApi.init()
  })

  test('new stream', async () => {
    const now = new Date()
    await indexApi.indexStream(STREAM_CONTENT)
    const result: Array<any> = await dataSource.query(`SELECT * FROM mid_${MODELS_TO_INDEX[0]}`)
    expect(result.length).toEqual(1)
    const raw = result[0]
    expect(raw.stream_id).toEqual(STREAM_ID_B)
    expect(raw.controller_did).toEqual(CONTROLLER)
    expect(raw.last_anchored_at).toBeNull()
    const createdAt = new Date(raw.created_at * 1000)
    const updatedAt = new Date(raw.updated_at * 1000)
    expect(closeDates(createdAt, now)).toBeTruthy()
    expect(closeDates(updatedAt, now)).toBeTruthy()
  })

  test('override stream', async () => {
    const createTime = new Date()
    await indexApi.indexStream(STREAM_CONTENT)
    const updateTime = new Date(createTime.valueOf() + 5000)
    const updatedStreamContent = {
      ...STREAM_CONTENT,
      updatedAt: updateTime,
      lastAnchor: updateTime,
    }
    // It updates the fields if a stream is present.
    await indexApi.indexStream(updatedStreamContent)
    const result: Array<any> = await dataSource.query(`SELECT * FROM mid_${MODELS_TO_INDEX[0]}`)
    expect(result.length).toEqual(1)
    const raw = result[0]
    expect(raw.stream_id).toEqual(STREAM_ID_B)
    expect(raw.controller_did).toEqual(CONTROLLER)
    const lastAnchor = new Date(raw.last_anchored_at * 1000)
    expect(closeDates(lastAnchor, updateTime)).toBeTruthy()
    const updatedAt = new Date(raw.updated_at * 1000)
    expect(closeDates(updatedAt, updateTime)).toBeTruthy()
    const createdAt = new Date(raw.created_at * 1000)
    expect(closeDates(createdAt, createTime)).toBeTruthy()
  })
})

function readFixture() {
  type CsvFixture = IndexStreamArgs & { createdAt?: Date }
  return new Promise<Array<CsvFixture>>((resolve, reject) => {
    const result = new Array<CsvFixture>()
    const csvReader = csv({
      separator: ';',
      mapHeaders: ({ header }) => (header ? header.replace(/\s+/g, '') : null),
    })
    fs.createReadStream(new URL('./index.fixture.csv', import.meta.url))
      .pipe(csvReader)
      .on('data', (row) => {
        result.push({
          model: MODEL,
          streamID: StreamID.fromString(row.stream_id),
          controller: row.controller,
          lastAnchor: row.last_anchored_at
            ? new Date(Number(row.last_anchored_at) * 1000)
            : undefined,
          createdAt: row.created_at ? new Date(Number(row.created_at) * 1000) : undefined,
        })
      })
      .on('error', (error) => reject(error))
      .on('end', () => {
        resolve(result)
      })
  })
}

describe('page', () => {
  let indexAPI: SqliteIndexApi

  beforeEach(async () => {
    indexAPI = new SqliteIndexApi(dataSource, konnection, MODELS_TO_INDEX)
    await indexAPI.init()
    const rows = await readFixture()
    for (const row of rows) {
      await indexAPI.indexStream(row)
    }
  })

  describe('default order', () => {
    const ALL_ENTRIES = [
      'k2t6wysde758e731xife7twg5dwpz8jg42vshm79ax6w7s0yu75kiaj8k2w6dt',
      'k2t6wysde758akkonpg6flj8fitylax3fk40xrb9ud4hmivd29jdc097ad6nwz',
      'k2t6wysde758et54lsbq54efgt73xqfg6s5sp72v9ervbn11z7w9rgb2r1fcu3',
      'k2t6wysde7589n4wvaiuhbokdvhtm71lxii24u8f12rlntsqakblz5u69vxgbu',
      'k2t6wysde7589wo4k3reakai9t5z52jgwfxdx8w0ug7px0s66o0h4qkkz134lb',
      'k2t6wyfsu4pfzxkvkqs4sxhgk2vy60icvko3jngl56qzmdewud4lscf5p93wna',
      'k2t6wysde758d3muw7okc3zspjlcpcjqzrchrdk5augruhpdha2od8tw46r0qh',
      'k2t6wysde758cpnjmqwp3zcsrcthn116vq6ayeivfsivilr02pj6pybbuzgkbt',
      'k2t6wysde758c9utjgo3caetaezu2cluj2p3gjttfqz111neyncd6z7ekxjfv9',
      'k2t6wysde7589pfiw4q6rm96t2yzjiheopr56gx7jsqatip8qk9ebesdft1w14',
      'k2t6wysde758cx9qi61w2001a5l5hx8f5no9yue3ewv0ftky5mbvalmuf3gchb',
      'k2t6wysde758aef79049queu07hgygp52a6i6an7of9y31vjf2bmyk2k0jwuod',
      'k2t6wysde7589p6n2wl0yrh0mi0g6vyzrfd8xmo6wj8f5xbjjs3flxc8z7rzhm',
      'k2t6wysde758a5g0poyqkp0ni2zfzw27j4fb2lkv5mkby35ss44kepa71axkk9',
      'k2t6wysde758c8jmww7tcvcprvs6i7uxl30cz17jwssf4i1q5f96bmx2xkk65b',
      'k2t6wysde758a7cnbum8auockii5f626vbi18keqegi52mob9z3kulecyvr04c',
      'k2t6wysde7589xsdd2tgrnedgm76fgk59cuo92pjibn6k9ichcxepmys19lluj',
      'k2t6wysde758d3tvke5zmqgq85s6m6dm593y5xl0desja6s1t6ub02osbsb8jv',
      'k2t6wysde758cgke6n0sr3yaor6shv5czq9d3dgmvb09jo8vy0gnlegbyowgs8',
      'k2t6wysde758b3nriettrnxt5eg39ylwo2o7sbvie1ny5tprdmvwnx9xoqwy67',
      'k2t6wysde7589fze9445oe7y578f7csh4uexfqe9r9qziqyz8koegst94ryoat',
    ]

    function chunks<T>(array: Array<T>, chunkSize: number): Array<Array<T>> {
      const result = new Array<Array<T>>()
      for (let i = 0; i < array.length; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize))
      }
      return result
    }

    test('forward pagination', async () => {
      const pageSize = 5
      const pages = chunks(ALL_ENTRIES, pageSize)
      let afterCursor: string | undefined = undefined
      for (let i = 0; i < pages.length; i++) {
        const result = await indexAPI.page({
          model: MODEL,
          first: pageSize,
          after: afterCursor,
        })
        afterCursor = result.pageInfo.endCursor
        const expected = pages[i]
        expect(result.entries.length).toEqual(expected.length)
        expect(result.entries.map(String)).toEqual(expected)
        const hasNextPage = Boolean(pages[i + 1])
        expect(result.pageInfo.hasNextPage).toEqual(hasNextPage)
        expect(result.pageInfo.hasPreviousPage).toEqual(false)
        expect(result.pageInfo.endCursor).toBeTruthy()
        expect(result.pageInfo.startCursor).toBeTruthy()
      }

      // const resultA = await indexAPI.page({
      //   model: MODEL,
      //   first: 5,
      // })
      // expect(resultA.entries.length).toEqual(5)
      // expect(resultA.entries.map(String)).toEqual(ALL_ENTRIES.slice(0, 5))
      // expect(resultA.pageInfo.hasNextPage).toEqual(true)
      // expect(resultA.pageInfo.hasPreviousPage).toEqual(false)
      // expect(resultA.pageInfo.endCursor).toBeTruthy()
      // expect(resultA.pageInfo.startCursor).toBeTruthy()
      // const resultB = await indexAPI.page({
      //   model: MODEL,
      //   first: 5,
      //   after: resultA.pageInfo.endCursor,
      // })
      // expect(resultB.entries.length).toEqual(5)
      // expect(resultB.entries.map(String)).toEqual(ALL_ENTRIES.slice(5, 10))
      // expect(resultB.pageInfo.hasNextPage).toEqual(true)
      // expect(resultB.pageInfo.hasPreviousPage).toEqual(false)
      // expect(resultB.pageInfo.endCursor).toBeTruthy()
      // expect(resultB.pageInfo.startCursor).toBeTruthy()
      // const resultC = await indexAPI.page({
      //   model: MODEL,
      //   first: 5,
      //   after: resultB.pageInfo.endCursor,
      // })
      // expect(resultC.entries.map(String)).toEqual(ALL_ENTRIES.slice(10, 15))
      // expect(resultC.pageInfo.hasNextPage).toEqual(true)
      // expect(resultC.pageInfo.hasPreviousPage).toEqual(false)
      // expect(resultC.pageInfo.endCursor).toBeTruthy()
      // expect(resultC.pageInfo.startCursor).toBeTruthy()
      // const resultD = await indexAPI.page({
      //   model: MODEL,
      //   first: 5,
      //   after: resultC.pageInfo.endCursor,
      // })
      // expect(resultD.entries.map(String)).toEqual(ALL_ENTRIES.slice(15, 20))
      // expect(resultD.pageInfo.hasNextPage).toEqual(true)
      // expect(resultD.pageInfo.hasPreviousPage).toEqual(false)
      // expect(resultD.pageInfo.endCursor).toBeTruthy()
      // expect(resultD.pageInfo.startCursor).toBeTruthy()
      // const resultE = await indexAPI.page({
      //   model: MODEL,
      //   first: 5,
      //   after: resultD.pageInfo.endCursor,
      // })
      // expect(resultE.entries.map(String)).toEqual(ALL_ENTRIES.slice(20, 21))
      // expect(resultE.pageInfo.hasNextPage).toEqual(false)
      // expect(resultE.pageInfo.hasPreviousPage).toEqual(false)
      // expect(resultE.pageInfo.endCursor).toBeTruthy()
      // expect(resultE.pageInfo.startCursor).toBeTruthy()
    })
    test('backward pagination', async () => {
      const pageSize = 5
      const pages = chunks(ALL_ENTRIES.reverse(), pageSize).map((arr) => arr.reverse())
      let beforeCursor: string | undefined = undefined
      for (let i = 0; i < pages.length; i++) {
        const result = await indexAPI.page({
          model: MODEL,
          last: pageSize,
          before: beforeCursor,
        })
        beforeCursor = result.pageInfo.startCursor
        const expected = pages[i]
        expect(result.entries.length).toEqual(expected.length)
        expect(result.entries.map(String)).toEqual(expected)
        const hasPreviousPage = Boolean(pages[i + 1])
        expect(result.pageInfo.hasNextPage).toEqual(false)
        expect(result.pageInfo.hasPreviousPage).toEqual(hasPreviousPage)
        expect(result.pageInfo.endCursor).toBeTruthy()
        expect(result.pageInfo.startCursor).toBeTruthy()
      }

      // const resultA = await indexAPI.page({
      //   model: MODEL,
      //   last: 5,
      // })
      // expect(resultA.entries.map(String)).toEqual(ALL_ENTRIES.slice(-5))
      // expect(resultA.entries.length).toEqual(5)
      // expect(resultA.pageInfo.hasNextPage).toEqual(false)
      // expect(resultA.pageInfo.hasPreviousPage).toEqual(true)
      // expect(resultA.pageInfo.endCursor).toBeTruthy()
      // expect(resultA.pageInfo.startCursor).toBeTruthy()
      // const resultB = await indexAPI.page({
      //   model: MODEL,
      //   last: 5,
      //   before: resultA.pageInfo.startCursor,
      // })
      // expect(resultB.entries.length).toEqual(5)
      // expect(resultB.entries.map(String)).toEqual(ALL_ENTRIES.slice(-10, -5))
      // expect(resultB.pageInfo.hasNextPage).toEqual(false)
      // expect(resultB.pageInfo.hasPreviousPage).toEqual(true)
      // expect(resultB.pageInfo.endCursor).toBeTruthy()
      // expect(resultB.pageInfo.startCursor).toBeTruthy()
      // const resultC = await indexAPI.page({
      //   model: MODEL,
      //   last: 5,
      //   before: resultB.pageInfo.startCursor,
      // })
      // expect(resultC.entries.length).toEqual(5)
      // expect(resultC.entries.map(String)).toEqual(ALL_ENTRIES.slice(-15, -10))
      // expect(resultC.pageInfo.hasNextPage).toEqual(false)
      // expect(resultC.pageInfo.hasPreviousPage).toEqual(true)
      // expect(resultC.pageInfo.endCursor).toBeTruthy()
      // expect(resultC.pageInfo.startCursor).toBeTruthy()
      // const resultD = await indexAPI.page({
      //   model: MODEL,
      //   last: 5,
      //   before: resultC.pageInfo.startCursor,
      // })
      // expect(resultD.entries.length).toEqual(5)
      // expect(resultD.entries.map(String)).toEqual(ALL_ENTRIES.slice(-20, -15))
      // expect(resultD.pageInfo.hasNextPage).toEqual(false)
      // expect(resultD.pageInfo.hasPreviousPage).toEqual(true)
      // expect(resultD.pageInfo.endCursor).toBeTruthy()
      // expect(resultD.pageInfo.startCursor).toBeTruthy()
      // const resultE = await indexAPI.page({
      //   model: MODEL,
      //   last: 5,
      //   before: resultD.pageInfo.startCursor,
      // })
      // expect(resultE.entries.length).toEqual(1)
      // expect(resultE.entries.map(String)).toEqual(ALL_ENTRIES.slice(-21, -20))
      // expect(resultE.pageInfo.hasNextPage).toEqual(false)
      // expect(resultE.pageInfo.hasPreviousPage).toEqual(false)
      // expect(resultE.pageInfo.endCursor).toBeTruthy()
      // expect(resultE.pageInfo.startCursor).toBeTruthy()
    })
  })
})
