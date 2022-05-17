import { Model } from '@ceramicnetwork/stream-model'
import { CeramicApi } from '@ceramicnetwork/common'
import { CommitID } from '@ceramicnetwork/streamid'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'

/**
 * Simple wrapper around AJV library for doing json-schema validation.
 * TODO: Move schema stream loading out of this.
 */
export class SchemaValidation {
  private readonly _validator: Ajv

  constructor() {
    this._validator = new Ajv({ allErrors: true, strictTypes: false, strictTuples: false })
    addFormats(this._validator)
  }

  public async validateSchema(
    ceramic: CeramicApi,
    content: Record<string, any>,
    schemaStreamId: string
  ): Promise<void> {
    const schema = await this._loadSchemaById(ceramic, schemaStreamId)
    this._validate(content, schema)
  }

  private async _loadSchemaById<T>(ceramic: CeramicApi, schemaStreamId: string): Promise<T | null> {
    let commitId: CommitID
    try {
      commitId = CommitID.fromString(schemaStreamId)
    } catch {
      throw new Error('Commit missing when loading schema document')
    }
    return ceramic.loadStream<Model<T>>(commitId).then((doc) => doc.content)
  }

  private _validate(content: Record<string, any>, schema: Record<string, any>): void {
    const isValid = this._validator.validate(schema, content)
    if (!isValid) {
      const errorMessages = this._validator.errorsText()
      throw new Error(`Validation Error: ${errorMessages}`)
    }
  }
}
