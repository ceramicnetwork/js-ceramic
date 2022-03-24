import 'reflect-metadata'

import { DataBase, IndexingService } from '../../lib'

function randomID(): string {
  return Math.random().toString(36).substring(2)
}

describe('collection-based queries', () => {
  const db = new DataBase({ type: 'sqlite', database: ':memory:', dropSchema: true })
  const service = new IndexingService({ db })

  afterAll(async () => {
    await db.dataSource.destroy()
  })

  test('get accounts using a definition in their index', async () => {
    // Need to be done in series to ensure snapshots are stable
    await service.index({
      id: 'recordID-1',
      tip: 'tip',
      metadata: {
        controllers: ['did:test:1'],
        family: 'definitionID-1',
        schema: 'ceramic://foo',
      },
    })
    await service.index({
      id: 'recordID-2',
      tip: 'tip',
      metadata: {
        controllers: ['did:test:2'],
        family: 'definitionID-1',
        schema: 'ceramic://foo',
      },
    })
    await service.index({
      id: 'recordID-3',
      tip: 'tip',
      metadata: {
        controllers: ['did:test:3'],
        family: 'definitionID-1',
        schema: 'ceramic://foo',
      },
    })

    // Shouldn't be in the results
    await Promise.all([
      service.index({
        id: randomID(),
        tip: 'tip',
        metadata: {
          controllers: ['did:test:1'],
          family: 'definitionID-1',
          // No schema
        },
      }),
      service.index({
        id: randomID(),
        tip: 'tip',
        metadata: {
          controllers: ['did:test:1'],
          // No family
          schema: 'ceramic://foo',
        },
      }),
      service.index({
        id: randomID(),
        tip: 'tip',
        metadata: {
          controllers: ['did:test:1'],
          family: 'definitionID-1',
          schema: 'ceramic://foo',
          unique: 'unique', // Non-deterministic
        },
      }),
      service.index({
        id: randomID(),
        tip: 'tip',
        metadata: {
          controllers: ['did:test:1'],
          family: 'definitionID-1',
          schema: 'ceramic://foo',
          tags: ['foo'], // Tags shouldn't be provided
        },
      }),
    ])

    await expect(
      service.getDefinitionAccountRecords({ definitionID: 'definitionID-1' })
    ).resolves.toMatchSnapshot()
  })
})
