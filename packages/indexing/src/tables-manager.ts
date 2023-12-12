import {
  DatabaseType,
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
import { Model } from '@ceramicnetwork/stream-model'
import { DiagnosticsLogger, FieldsIndex, Networks } from '@ceramicnetwork/common'
import {
  INDEXED_MODEL_CONFIG_TABLE_NAME,
  IndexModelArgs,
  MODEL_IMPLEMENTS_TABLE_NAME,
  fieldsIndexName,
} from './database-index-api.js'
import { STRUCTURES } from './migrations/cdb-schema-verification.js'
import { CONFIG_TABLE_NAME } from './config.js'

export type CreateIndicesRecord = Record<string, Array<FieldsIndex>>

/**
 * ComposeDB Config Table Type
 */
type ConfigTable = {
  readonly tableName: string
  readonly validSchema: object
}

const CUSTOM_COLUMN_PREFIX = 'custom_'

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
  async initMidTables(
    _modelsToIndex: Array<IndexModelArgs>,
    _createIndices: CreateIndicesRecord
  ): Promise<void> {
    throw new Error('Must be implemented in extending class')
  }

  /**
   * Determine if a mid table has the indices we expect
   * @param tableName
   * @param args
   */
  async hasMidIndices(_tableName: string, _args: IndexModelArgs): Promise<boolean> {
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
        `Schema verification failed for config table: ${table.tableName}. Please make sure node has been setup correctly.`
      )
    }
  }

  /**
   * List and migrate all MID tables
   */
  async migrateMidTables(): Promise<void> {
    const tableNames = await this.listMidTables()
    await Promise.all(
      tableNames.map(async (table) => {
        return await this._migrateMidTable(table)
      })
    )
  }

  /**
   * Migrate a MID table
   * @param tableName
   */
  async _migrateMidTable(tableName: string): Promise<void> {
    const columns = await this.dataSource.table(tableName).columnInfo()
    const relationColumns = Object.keys(columns).filter((name) => {
      return name.startsWith(CUSTOM_COLUMN_PREFIX)
    })
    if (relationColumns.length) {
      // Remove relations columns that are no longer necessary
      await this.dataSource.schema.alterTable(tableName, (table) => {
        table.dropColumns(...relationColumns)
      })
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
    const validSchema = JSON.stringify(expectedTableStructure)

    const columns = await this.dataSource.table(tableName).columnInfo()
    const actualSchema = JSON.stringify(columns)
    if (validSchema != actualSchema) {
      throw new Error(
        `Schema verification failed for index: ${tableName}. Please make sure latest migrations have been applied.`
      )
    }

    if (!(await this.hasMidIndices(tableName, modelIndexArgs))) {
      throw new Error(
        `Schema verification failed for index: ${tableName}. Please make sure latest migrations have been applied.`
      )
    }
  }

  /**
   * Public function to run table schema verification helpers
   */
  async verifyTables(modelsToIndex: Array<IndexModelArgs>) {
    await Promise.all([this._verifyConfigTables(), this._verifyMidTables(modelsToIndex)])
  }
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
  override async initMidTables(
    modelsToIndex: Array<IndexModelArgs>,
    createIndices: CreateIndicesRecord
  ) {
    await Promise.all(
      modelsToIndex.map(async (modelIndexArgs) => {
        await this.initMidTable(modelIndexArgs, createIndices[modelIndexArgs.model.toString()])
      })
    )
  }

  /**
   * Create a single mid table for a given model
   */
  async initMidTable(modelIndexArgs: IndexModelArgs, createIndices: Array<FieldsIndex> = []) {
    const tableName = asTableName(modelIndexArgs.model)
    if (tableName.length > 63) {
      const errStr = `Cannot index model ${modelIndexArgs.model.toString()}.  Table name is too long: ${tableName}`
      this.logger.err(errStr)
      throw new Error(errStr)
    }

    const exists = await this.dataSource.schema.hasTable(tableName)
    if (!exists) {
      this.logger.imp(`Creating ComposeDB Indexing table for model: ${tableName}`)
      await createPostgresModelTable(this.dataSource, tableName)
    }

    await createPostgresIndices(this.dataSource, tableName, createIndices)
  }

  /**
   * Determine if a mid table has the indices we expect
   * @param tableName
   * @param args
   */
  override async hasMidIndices(tableName: string, args: IndexModelArgs): Promise<boolean> {
    const expectedIndices = defaultIndices(tableName).indices.flatMap((index) => index.name)
    if (args && args.indices) {
      for (const index of args.indices) {
        expectedIndices.push(fieldsIndexName(index, tableName))
      }
    }
    const sqlIndices = expectedIndices.map((s) => `'${s}'`)
    const actualIndices = await this.dataSource.raw(`
select *
from pg_indexes
where tablename like '${tableName}'
and indexname in (${sqlIndices});
  `)
    return expectedIndices.length == actualIndices.rowCount
  }

  override hasJsonBSupport(): boolean {
    return true
  }
}

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
  override async initMidTables(
    modelsToIndex: Array<IndexModelArgs>,
    createIndices: CreateIndicesRecord
  ) {
    const existingTables = await this.listMidTables()
    await Promise.all(
      modelsToIndex.map(async (modelIndexArgs) => {
        await this.initMidTable(
          modelIndexArgs,
          existingTables,
          createIndices[modelIndexArgs.model.toString()]
        )
      })
    )
  }

  /**
   * Create a single mid table for a given model
   */
  async initMidTable(
    modelIndexArgs: IndexModelArgs,
    existingTables: Array<string>,
    createIndices: Array<FieldsIndex> = []
  ) {
    const tableName = asTableName(modelIndexArgs.model)

    if (!existingTables.includes(tableName)) {
      this.logger.imp(`Creating ComposeDB Indexing table for model: ${tableName}`)
      await createSqliteModelTable(this.dataSource, tableName)
    }

    await createSqliteIndices(this.dataSource, tableName, createIndices)
  }

  /**
   * Determine if a mid table has the indices we expect
   * @param tableName
   * @param args IndexModelArgs for checking indices
   */
  override async hasMidIndices(tableName: string, args: IndexModelArgs): Promise<boolean> {
    const expectedIndices = defaultIndices(tableName).indices.flatMap((index) => index.name)
    if (args && args.indices) {
      for (const index of args.indices) {
        expectedIndices.push(fieldsIndexName(index, tableName))
      }
    }
    const sqlIndices = expectedIndices.map((s) => `'${s}'`)
    const actualIndices = await this.dataSource.raw(`
select name, tbl_name
FROM sqlite_master
WHERE type='index'
and tbl_name like '${tableName}'
and name in (${sqlIndices})
;
  `)
    return expectedIndices.length == actualIndices.length
  }

  override hasJsonBSupport(): boolean {
    return false
  }
}
