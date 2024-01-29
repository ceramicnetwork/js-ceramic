import {
  DatabaseType,
  ColumnInfo,
  ColumnType,
  createConfigTable,
  createPostgresModelTable,
  createSqliteModelTable,
  defaultIndices,
  createSqliteIndices,
  createPostgresIndices,
  migrateConfigTable,
} from './migrations/1-create-model-table.js'
import { asTableName } from './as-table-name.util.js'
import { Knex } from 'knex'
import { Model, ModelRelationsDefinition } from '@ceramicnetwork/stream-model'
import { DiagnosticsLogger, Networks } from '@ceramicnetwork/common'
import {
  INDEXED_MODEL_CONFIG_TABLE_NAME,
  IndexModelArgs,
  MODEL_IMPLEMENTS_TABLE_NAME,
  fieldsIndexName,
} from './database-index-api.js'
import { STRUCTURES } from './migrations/cdb-schema-verification.js'
import { CONFIG_TABLE_NAME } from './config.js'
import { addColumnPrefix } from './column-name.util.js'

/**
 * ComposeDB Config Table Type
 */
type ConfigTable = {
  readonly tableName: string
  readonly validSchema: object
}

/**
 * Create a list of db column info for relations in a given model
 */
function relationsDefinitionsToColumnInfo(relations?: ModelRelationsDefinition): Array<ColumnInfo> {
  if (!relations) {
    return []
  }
  return Object.keys(relations).map((keyName) => {
    return { name: addColumnPrefix(keyName), type: ColumnType.STRING }
  })
}

export class TablesManager {
  constructor(
    readonly dbType: DatabaseType,
    readonly dataSource: Knex,
    readonly logger: DiagnosticsLogger
  ) {}

  /**
   * List existing mid tables.
   */
  async listMidTables(): Promise<Array<string>> {
    throw new Error('Must be implemented in extending class')
  }

  /**
   * Create mid tables and corresponding indexes
   */
  async initMidTables(_modelsToIndex: Array<IndexModelArgs>): Promise<void> {
    throw new Error('Must be implemented in extending class')
  }

  /**
   * Determine if a mid table has the indices we expect
   * @param tableName
   * @param args
   */
  async assertHasMidIndices(_tableName: string, _args: IndexModelArgs): Promise<void> {
    throw new Error('Must be implemented in extending class')
  }

  /**
   * Determine if this manager supports jsonb
   */
  hasJsonBSupport(): boolean {
    throw new Error('Must be implemented in extending class')
  }

  /**
   * List existing config tables.
   */
  listConfigTables(): Array<ConfigTable> {
    // TODO (CDB-1852): extend with ceramic_auth; If it will need to be async, see if it can be parallelised within initConfigTables(...)
    return [
      {
        tableName: INDEXED_MODEL_CONFIG_TABLE_NAME,
        validSchema: STRUCTURES[this.dbType].CONFIG_TABLE_MODEL_INDEX,
      },
      { tableName: CONFIG_TABLE_NAME, validSchema: STRUCTURES[this.dbType].CONFIG_TABLE },
      {
        tableName: MODEL_IMPLEMENTS_TABLE_NAME,
        validSchema: STRUCTURES[this.dbType].MODEL_IMPLEMENTS_TABLE,
      },
    ]
  }

  /**
   * Create ComposeDB config tables
   */
  async initConfigTables(network: Networks) {
    const configTables = this.listConfigTables()
    await Promise.all(
      configTables.map(async (table) => {
        await this.initConfigTable(table, network)
      })
    )
  }

  /**
   * Create a single DB config table
   */
  async initConfigTable(table: ConfigTable, network: Networks) {
    const exists = await this.dataSource.schema.hasTable(table.tableName)
    if (!exists) {
      this.logger.imp(`Creating ComposeDB config table: ${table.tableName}`)
      await createConfigTable(this.dataSource, table.tableName, network, this.hasJsonBSupport())
    } else {
      await migrateConfigTable(this.dataSource, table.tableName, this.hasJsonBSupport())
      if (table.tableName === CONFIG_TABLE_NAME) {
        const config = await this.dataSource
          .from(table.tableName)
          .where('option', 'network')
          .first('value')
        if (config.value !== network) {
          throw new Error(
            `Initialization failed for config table: ${table.tableName}. The database is configured to use the network ${config.value} but the current network is ${network}.`
          )
        }
      }
    }
  }

  /**
   * ComposeDB configuration table schema verification
   */
  async _verifyConfigTables() {
    const configTables = this.listConfigTables()
    await Promise.all(
      configTables.map(async (configTable) => {
        await this._verifyConfigTable(configTable)
      })
    )
  }

  /**
   * Verify a single config table schema
   */
  async _verifyConfigTable(table: ConfigTable) {
    const columns = await this.dataSource.table(table.tableName).columnInfo()
    const validSchema = JSON.stringify(table.validSchema)
    const actualSchema = JSON.stringify(columns)

    if (validSchema != actualSchema) {
      throw new Error(
        `Schema verification failed for config table: ${table.tableName}. Please make sure node has been setup correctly.
    Expected=${JSON.stringify(validSchema)}
    Actual=${JSON.stringify(actualSchema)}
        `
      )
    }
  }

  /**
   * ComposeDB Model Instance Document table schema verification
   */
  async _verifyMidTables(modelsToIndex: Array<IndexModelArgs>) {
    const tableNames = await this.listMidTables()
    await Promise.all(
      tableNames.map(async (tableName) => {
        await this._verifyMidTable(tableName, modelsToIndex)
      })
    )
  }

  /**
   * Verify a single mid table schema
   */
  async _verifyMidTable(tableName: string, modelsToIndex: Array<IndexModelArgs>) {
    const modelIndexArgs = modelsToIndex.find((model) => tableName == asTableName(model.model))
    if (!modelIndexArgs) {
      // TODO: CDB-1869 - This means that there's is a table for a model that is no longer indexed. Should this table have been deleted?
      return
    }

    // Clone the COMMON_TABLE_STRUCTURE object that has the fields expected for all tables so we can
    // extend it with the model-specific fields expected
    const expectedTableStructure = Object.assign({}, STRUCTURES[this.dbType].COMMON_TABLE)
    if (modelIndexArgs.relations) {
      for (const relation of Object.keys(modelIndexArgs.relations)) {
        expectedTableStructure[addColumnPrefix(relation)] = STRUCTURES[this.dbType].RELATION_COLUMN
      }
    }
    const validSchema = JSON.stringify(expectedTableStructure)

    const columns = await this.dataSource.table(tableName).columnInfo()
    const actualSchema = JSON.stringify(columns)
    if (validSchema != actualSchema) {
      throw new Error(
        `Schema verification failed for index: ${tableName}. Please make sure latest migrations have been applied.
    Expected=${JSON.stringify(validSchema)}
    Actual=${JSON.stringify(actualSchema)}
        `
      )
    }

    await this.assertHasMidIndices(tableName, modelIndexArgs)
  }

  /**
   * Public function to run table schema verification helpers
   */
  async verifyTables(modelsToIndex: Array<IndexModelArgs>) {
    await Promise.all([this._verifyConfigTables(), this._verifyMidTables(modelsToIndex)])
  }

  validateIndices(tableName: string, expect: Array<string>, actual: Array<string>) {
    const missingIndices = expect.filter((indexName) => {
      return !actual.includes(indexName)
    })
    if (missingIndices.length > 0) {
      throw new Error(`Schema verification failed for index: ${tableName}. Please make sure latest migrations have been applied.
          Missing Indices=${JSON.stringify(missingIndices)}
          Actual=${JSON.stringify(actual)}`
      )
    }
  }
}

type PgIndexRow = {
  readonly tablename: string
  readonly indexname: string
}

type PgIndexResult = {
  readonly rows: Array<PgIndexRow>
}

export class PostgresTablesManager extends TablesManager {
  constructor(dataSource: Knex, logger: DiagnosticsLogger) {
    super(DatabaseType.POSTGRES, dataSource, logger)
  }

  /**
   * List existing mid tables.
   */
  override async listMidTables(): Promise<Array<string>> {
    const result: Array<{ tablename: string }> = await this.dataSource
      .select('tablename')
      .from('pg_tables')
      .andWhere((q) =>
        q.whereLike('tablename', 'kjz%').orWhere('tablename', Model.MODEL.toString())
      )
    return result.map((value) => value.tablename)
  }

  /**
   * Create mid tables and corresponding indexes
   */
  override async initMidTables(modelsToIndex: Array<IndexModelArgs>) {
    await Promise.all(
      modelsToIndex.map(async (modelIndexArgs) => {
        await this.initMidTable(modelIndexArgs)
      })
    )
  }

  /**
   * Create a single mid table for a given model
   */
  async initMidTable(modelIndexArgs: IndexModelArgs) {
    const tableName = asTableName(modelIndexArgs.model)
    if (tableName.length > 63) {
      const errStr = `Cannot index model ${modelIndexArgs.model.toString()}.  Table name is too long: ${tableName}`
      this.logger.err(errStr)
      throw new Error(errStr)
    }

    const relationColumns = relationsDefinitionsToColumnInfo(modelIndexArgs.relations)
    const exists = await this.dataSource.schema.hasTable(tableName)
    if (!exists) {
      this.logger.imp(`Creating ComposeDB Indexing table for model: ${tableName}`)
      await createPostgresModelTable(this.dataSource, tableName, relationColumns)
      if (modelIndexArgs.indices) {
        await createPostgresIndices(this.dataSource, tableName, modelIndexArgs.indices)
      }
    } else if (relationColumns.length) {
      // Make relations columns nullable
      await this.dataSource.schema.alterTable(tableName, (table) => {
        for (const column of relationColumns) {
          if (column.type === ColumnType.STRING) {
            const columnName = addColumnPrefix(column.name)
            table.string(columnName, 1024).nullable().alter()
          }
        }
      })
    }
  }

  /**
   * Determine if a mid table has the indices we expect
   * @param tableName
   * @param args
   */
  override async assertHasMidIndices(tableName: string, args: IndexModelArgs): Promise<void> {
    const expectedIndices = defaultIndices(tableName).indices.flatMap((index) => index.name)
    if (args && args.indices) {
      for (const index of args.indices) {
        expectedIndices.push(fieldsIndexName(index, tableName).toLowerCase())
      }
    }
    const indicesResult = (
      await this.dataSource.raw<PgIndexResult>(`
select *
from pg_indexes
where tablename like '${tableName}'
    `)
    )
    const actualIndices = indicesResult ? indicesResult.rows.map((row) => row.indexname) : []
    this.validateIndices(tableName, expectedIndices, actualIndices)
  }

  override hasJsonBSupport(): boolean {
    return true
  }
}

type SqliteIndexRow = {
  readonly name: string
  readonly tbl_name: string
}

type SqliteIndexResult = Array<SqliteIndexRow>

export class SqliteTablesManager extends TablesManager {
  constructor(dataSource: Knex, logger: DiagnosticsLogger) {
    super(DatabaseType.SQLITE, dataSource, logger)
  }

  /**
   * List existing mid tables.
   */
  override async listMidTables(): Promise<Array<string>> {
    const result: Array<{ name: string }> = await this.dataSource
      .from('sqlite_schema')
      .select('name')
      .whereIn('type', ['table'])
      .andWhere((q) => q.whereLike('name', 'kjz%').orWhere('name', Model.MODEL.toString()))
    return result.map((r) => r.name)
  }

  /**
   * Create mid tables and corresponding indexes
   */
  override async initMidTables(modelsToIndex: Array<IndexModelArgs>) {
    const existingTables = await this.listMidTables()
    await Promise.all(
      modelsToIndex.map(async (modelIndexArgs) => {
        await this.initMidTable(modelIndexArgs, existingTables)
      })
    )
  }

  /**
   * Create a single mid table for a given model
   */
  async initMidTable(modelIndexArgs: IndexModelArgs, existingTables: Array<string>) {
    const tableName = asTableName(modelIndexArgs.model)
    const relationColumns = relationsDefinitionsToColumnInfo(modelIndexArgs.relations)
    if (existingTables.includes(tableName)) {
      if (relationColumns.length) {
        // Make relations columns nullable
        await this.dataSource.schema.alterTable(tableName, (table) => {
          for (const column of relationColumns) {
            if (column.type === ColumnType.STRING) {
              const columnName = addColumnPrefix(column.name)
              table.string(columnName, 1024).nullable().alter()
            }
          }
        })
      }
      return
    }

    this.logger.imp(`Creating ComposeDB Indexing table for model: ${tableName}`)
    await createSqliteModelTable(this.dataSource, tableName, relationColumns)
    if (modelIndexArgs.indices) {
      await createSqliteIndices(this.dataSource, tableName, modelIndexArgs.indices)
    }
  }

  /**
   * Determine if a mid table has the indices we expect
   * @param tableName
   * @param args IndexModelArgs for checking indices
   */
  override async assertHasMidIndices(tableName: string, args: IndexModelArgs): Promise<void> {
    const expectedIndices = defaultIndices(tableName).indices.flatMap((index) => index.name)
    if (args && args.indices) {
      for (const index of args.indices) {
        expectedIndices.push(fieldsIndexName(index, tableName))
      }
    }
    const indicesResult = await this.dataSource.raw<SqliteIndexResult>(`
select name, tbl_name
FROM sqlite_master
WHERE type='index'
and tbl_name like '${tableName}'
;
  `)
    const actualIndices = indicesResult ? indicesResult.map((row) => row.name) : []
    this.validateIndices(tableName, expectedIndices, actualIndices)
  }

  override hasJsonBSupport(): boolean {
    return false
  }
}
