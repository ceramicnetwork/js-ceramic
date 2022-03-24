import 'reflect-metadata'

import { DataBase, IndexingService } from '../..'

function randomID(): string {
  return Math.random().toString(36).substring(2)
}

describe('account-based queries', () => {
  const db = new DataBase({ type: 'sqlite', database: ':memory:', dropSchema: true })
  const service = new IndexingService({ db })

  afterAll(async () => {
    await db.dataSource.destroy()
  })

  test('account index', async () => {
    // Should be in index for 'did:test:1'
    // Need to be done in series to ensure snapshots are stable
    await service.index({
      id: 'recordID-1',
      tip: 'tip-1',
      metadata: {
        controllers: ['did:test:1'],
        family: 'definitionID-1',
        schema: 'ceramic://foo',
      },
    })
    await service.index({
      id: 'recordID-2',
      tip: 'tip-2',
      metadata: {
        controllers: ['did:test:1'],
        family: 'definitionID-2',
        schema: 'ceramic://foo',
      },
    })

    // Shouldn't be in index for 'did:test:1'
    await Promise.all([
      service.index({
        id: randomID(),
        tip: 'tip',
        metadata: {
          controllers: ['did:test:2'], // Different controller
          family: 'definitionID-1',
          schema: 'ceramic://foo',
        },
      }),
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
          family: 'definitionID-3',
          schema: 'ceramic://foo',
          tags: ['foo'], // Tags shouldn't be provided
        },
      }),
    ])

    await expect(service.getAccountIndex({ account: 'did:test:1' })).resolves.toMatchSnapshot()
  })

  test('account records', async () => {
    // Should be in records for 'did:test:1'
    // Need to be done in series to ensure snapshots are stable
    await service.index({
      id: 'account-recordID-1',
      tip: 'tip-1',
      metadata: {
        controllers: ['did:test:1'],
        family: 'account-records',
        schema: 'ceramic://foo',
        unique: 'unique',
        tags: ['foo'],
      },
    })
    await service.index({
      id: 'account-recordID-2',
      tip: 'tip-2',
      metadata: {
        controllers: ['did:test:1'],
        family: 'account-records',
        schema: 'ceramic://foobar',
        unique: 'unique',
        tags: ['bar'],
      },
    })

    // Shouldn't be in records for 'did:test:1'
    await Promise.all([
      service.index({
        id: randomID(),
        tip: 'tip',
        metadata: {
          controllers: ['did:test:2'], // Different controller
          family: 'account-records',
          schema: 'ceramic://foo',
          unique: 'unique',
        },
      }),
      service.index({
        id: randomID(),
        tip: 'tip',
        metadata: {
          controllers: ['did:test:1'],
          family: 'other-records', // Different family
          schema: 'ceramic://foo',
          unique: 'unique',
        },
      }),
      service.index({
        id: randomID(),
        tip: 'tip',
        metadata: {
          controllers: ['did:test:1'],
          family: 'account-records',
          // No schema
          unique: 'unique',
        },
      }),
      service.index({
        id: randomID(),
        tip: 'tip',
        metadata: {
          controllers: ['did:test:1'],
          // No family
          schema: 'ceramic://foo',
          unique: 'unique',
        },
      }),
    ])

    // All records in collection
    await expect(
      service.getAccountRecords({ account: 'did:test:1', family: 'account-records' })
    ).resolves.toMatchSnapshot()

    // Additional filter by schema
    await expect(
      service.getAccountRecords({
        account: 'did:test:1',
        family: 'account-records',
        schema: 'foobar',
      })
    ).resolves.toMatchSnapshot()
  })

  test('account links', async () => {
    // Need to be done in series to ensure snapshots are stable
    await service.index({
      id: 'follow-alice-bob',
      tip: 'tip',
      metadata: {
        controllers: ['did:alice'],
        tags: ['did:bob'],
        family: 'follow',
        schema: 'foo',
      },
    })
    await service.index({
      id: 'follow-alice-charlie',
      tip: 'tip',
      metadata: {
        controllers: ['did:alice'],
        tags: ['did:charlie'],
        family: 'follow',
        schema: 'foo',
      },
    })
    await service.index({
      id: 'follow-alice-dan',
      tip: 'tip',
      metadata: {
        controllers: ['did:alice'],
        tags: ['did:dan'],
        family: 'follow',
        schema: 'foo',
      },
    })
    await service.index({
      id: 'follow-bob-alice',
      tip: 'tip',
      metadata: {
        controllers: ['did:bob'],
        tags: ['did:alice'],
        family: 'follow',
        schema: 'bar',
      },
    })
    await service.index({
      id: 'follow-bob-charlie',
      tip: 'tip',
      metadata: {
        controllers: ['did:bob'],
        tags: ['did:charlie'],
        family: 'follow',
        schema: 'bar',
      },
    })
    await service.index({
      id: 'follow-charlie-alice',
      tip: 'tip',
      metadata: {
        controllers: ['did:charlie'],
        tags: ['did:alice'],
        family: 'follow',
        schema: 'foo',
      },
    })
    await service.index({
      id: 'friend-alice-bob',
      tip: 'tip',
      metadata: {
        controllers: ['did:alice'],
        tags: ['did:bob'],
        family: 'friend',
        schema: 'foo',
      },
    })
    await service.index({
      id: 'friend-alice-charlie',
      tip: 'tip',
      metadata: {
        controllers: ['did:alice'],
        tags: ['did:charlie'],
        family: 'friend',
        schema: 'foo',
      },
    })
    await service.index({
      id: 'friend-bob-alice',
      tip: 'tip',
      metadata: {
        controllers: ['did:bob'],
        tags: ['did:alice'],
        family: 'friend',
        schema: 'foo',
      },
    })

    await expect(
      service.getAccountLinksFrom({ account: 'did:alice', family: 'follow' })
    ).resolves.toMatchSnapshot()

    await expect(
      service.getAccountLinksTo({ account: 'did:alice', family: 'follow' })
    ).resolves.toMatchSnapshot()

    await expect(
      service.getAccountLinksTo({ account: 'did:alice', family: 'follow', schema: 'bar' })
    ).resolves.toMatchSnapshot()
  })
})
