import {
  DatabaseType,
  ColumnInfo,
  ColumnType,
  createConfigTable,
  createPostgresModelTable,
  createSqliteModelTable,
} from './migrations/1-create-model-table.js'
import { asTableName } from './as-table-name.util.js'
import { Knex } from 'knex'
import { Model, ModelRelationsDefinition } from '@ceramicnetwork/stream-model'
import { DiagnosticsLogger, Networks } from '@ceramicnetwork/common'
import { INDEXED_MODEL_CONFIG_TABLE_NAME, IndexModelArgs } from './database-index-api.js'
import { STRUCTURES } from './migrations/cdb-schema-verification.js'
import { CONFIG_TABLE_NAME } from './config.js'
import { addColumnPrefix } from './column-name.util.js'

/**
 * Compose DB Config Table Type
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
  async initMidTables(modelsToIndex: Array<IndexModelArgs>): Promise<void> {
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
    ]
  }

  /**
   * Create Compose DB config tables
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
      this.logger.imp(`Creating Compose DB config table: ${table.tableName}`)
      await createConfigTable(this.dataSource, table.tableName, network)
    } else if (table.tableName === CONFIG_TABLE_NAME) {
      const config = await this.dataSource.from(table.tableName).where('option').first('network')
      if (config.network !== network) {
        throw new Error(
          `Initialization failed for config table: ${table.tableName}. The database is configured to use the network ${config.network} but the current network is ${network}.`
        )
      }
    }
  }

  /**
   * Compose DB configuration table schema verification
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

    if (validSchema != JSON.stringify(columns)) {
      throw new Error(
        `Schema verification failed for config table: ${table.tableName}. Please make sure node has been setup correctly.`
      )
    }
  }

  /**
   * Compose DB Model Instance Document table schema verification
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
    if (validSchema != JSON.stringify(columns)) {
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
  async listMidTables(): Promise<Array<string>> {
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
  async initMidTables(modelsToIndex: Array<IndexModelArgs>) {
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

    const exists = await this.dataSource.schema.hasTable(tableName)
    if (!exists) {
      this.logger.imp(`Creating Compose DB Indexing table for model: ${tableName}`)
      const relationColumns = relationsDefinitionsToColumnInfo(modelIndexArgs.relations)
      await createPostgresModelTable(this.dataSource, tableName, relationColumns)
    }
  }
}

export class SqliteTablesManager extends TablesManager {
  constructor(dataSource: Knex, logger: DiagnosticsLogger) {
    super(DatabaseType.SQLITE, dataSource, logger)
  }

  /**
   * List existing mid tables.
   */
  async listMidTables(): Promise<Array<string>> {
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
  async initMidTables(modelsToIndex: Array<IndexModelArgs>) {
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
    if (existingTables.includes(tableName)) {
      return
    }
    this.logger.imp(`Creating Compose DB Indexing table for model: ${tableName}`)
    const relationColumns = relationsDefinitionsToColumnInfo(modelIndexArgs.relations)
    await createSqliteModelTable(this.dataSource, tableName, relationColumns)
  }
}
