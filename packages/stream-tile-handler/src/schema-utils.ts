import { TileDocument } from '@ceramicnetwork/stream-tile'
import { CeramicApi } from '@ceramicnetwork/common'
import { CommitID } from '@ceramicnetwork/streamid'
import Ajv from 'ajv'
import type { Schema } from 'ajv'
import addFormats from 'ajv-formats'
import lru from 'lru_map'

function buildAjv(): Ajv {
  const validator = new Ajv({ allErrors: true, strictTypes: false, strictTuples: false })
  addFormats(validator)
  return validator
}

const AJV_CACHE_SIZE = 500

/**
 * Simple wrapper around AJV library for doing json-schema validation.
 * TODO: Move schema stream loading out of this.
 */
export class SchemaValidation {
  readonly validators: lru.LRUMap<string, Ajv>

  constructor() {
    this.validators = new lru.LRUMap(AJV_CACHE_SIZE)
  }

  public async validateSchema(
    ceramic: CeramicApi,
    content: Record<string, any>,
    schemaStreamId: string
  ): Promise<void> {
    const schema = await this._loadSchemaById(ceramic, schemaStreamId)
    this._validate(content, schema, schemaStreamId)
  }

  private async _loadSchemaById<T = unknown>(
    ceramic: CeramicApi,
    schemaStreamId: string
  ): Promise<T | null> {
    let commitId: CommitID
    try {
      commitId = CommitID.fromString(schemaStreamId)
    } catch {
      throw new Error('Commit missing when loading schema document')
    }
    const stream = await ceramic.loadStream<TileDocument<T>>(commitId)
    return stream.content
  }

  private _validate(content: Record<string, any>, schema: unknown, schemaStreamId: string): void {
    let validator = this.validators.get(schemaStreamId)
    if (!validator) {
      validator = buildAjv()
      this.validators.set(schemaStreamId, validator)
    }
    // Type casting, because we know that validator would throw an error if schema is wrong.
    const isValid = validator.validate(schema as Schema, content)

    if (!isValid) {
      const errorMessages = validator.errorsText()
      throw new Error(`Validation Error: ${errorMessages}`)
    }
  }
}
