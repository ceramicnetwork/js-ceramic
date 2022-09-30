import { AdminApi, DiagnosticsLogger, LogStyle } from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'
import { LocalIndexApi } from './indexing/local-index-api.js'
import crypto from 'crypto'

// TODO: Expose this as a config option?
const ADMIN_API_AUTHORIZATION_TIMEOUT = 1000 * 60 * 1 // 1 min

type AdminCode = string
type Timestamp = number

type AdminCodeCache = {
  [key: AdminCode]: Timestamp
}

/**
 * AdminApi for Ceramic core.
 */
export class LocalAdminApi implements AdminApi {
  private readonly codeCache: AdminCodeCache = {} as AdminCodeCache

  constructor(
    private readonly adminDids: Array<string> | undefined,
    private readonly indexApi: LocalIndexApi,
    private readonly logger: DiagnosticsLogger
  ) {}

  private verifyActingDid(actingDid: string) {
    if (!this.adminDids || !this.adminDids.some( adminDid => actingDid.startsWith(adminDid) )) {
      this.logger.log(LogStyle.warn, `Unauthorized access attempt to Admin Api from did: ${actingDid}`)
      throw Error(`Unauthorized access: DID '${actingDid}' does not have admin access permission to this node`)
    }
  }

  async generateCode(): Promise<string> {
    const newCode = crypto.randomUUID()
    const now = (new Date).getTime()
    this.codeCache[newCode] = now
    return newCode
  }

  verifyAndDiscardCode(code: string) {
    const now = (new Date).getTime()
    if (!this.codeCache[code]) {
      this.logger.log(LogStyle.warn, `Unauthorized access attempt to Admin Api with admin code missing from registry`)
      throw Error(`Unauthorized access: invalid/already used admin code`)
    } else if (now - this.codeCache[code] > ADMIN_API_AUTHORIZATION_TIMEOUT) {
      this.logger.log(LogStyle.warn, `Unauthorized access attempt to Admin Api with expired admin code`)
      throw Error(`Unauthorized access: expired admin code - admin codes are only valid for ${ADMIN_API_AUTHORIZATION_TIMEOUT / 1000} seconds`)
    } else {
      delete this.codeCache[code]
    }
  }

  async startIndexingModels(actingDid: string, modelsIDs: Array<StreamID>): Promise<void> {
    this.verifyActingDid(actingDid)
    this.logger.log(LogStyle.info, `Adding models to index: ${modelsIDs}`)
    await this.indexApi.indexModels(modelsIDs)
  }

  getIndexedModels(actingDid: string): Promise<Array<StreamID>> {
    this.verifyActingDid(actingDid)
    return Promise.resolve(this.indexApi.indexedModels() ?? [])
  }

  async stopIndexingModels(actingDid: string, modelsIDs: Array<StreamID>): Promise<void> {
    this.verifyActingDid(actingDid)
    this.logger.log(LogStyle.info, `Removing models from index: ${modelsIDs}`)
    await this.indexApi.stopIndexingModels(modelsIDs)
  }
}
