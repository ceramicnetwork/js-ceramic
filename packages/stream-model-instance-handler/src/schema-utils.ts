import { ModelInstanceDocument } from '@ceramicnetwork/stream-model-instance'
import { CeramicApi } from '@ceramicnetwork/common'
import { CommitID } from '@ceramicnetwork/streamid'
import ajv, { SchemaObject } from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'

/**
 * Simple wrapper around AJV library for doing json-schema validation.
 * TODO: Move schema stream loading out of this.
 */
export class SchemaValidation {
  private readonly _validator = new ajv({
    strict: true,
    allErrors: true,
    allowMatchingProperties: false,
    ownProperties: false,
    unevaluated: false,
  })

  constructor() {
    addFormats(this._validator)
  }

  public async validateSchema(
    ceramic: CeramicApi,
    content: Record<string, any>,
    schemaStreamId: string
  ): Promise<void> {
    console.log("VALIDATING MID!!!")
    console.log("GOT CERAMIC", ceramic)
    console.log("GOT CONTENT", content)
    console.log("GOT SCHEMA STREAM ID", schemaStreamId)
    const schema = await this._loadSchemaById(ceramic, schemaStreamId)
    this._validate(content, schema)
  }

  private async _loadSchemaById<T>(ceramic: CeramicApi, schemaStreamId: string): Promise<T | null> {
    console.log("NEED TO FETCH THE MODEL TO VALIDATE MID", schemaStreamId)
    let commitId: CommitID
    try {
      commitId = CommitID.fromString(schemaStreamId)
    } catch {
      throw new Error('Commit missing when loading schema document')
    }
    return ceramic.loadStream<ModelInstanceDocument<T>>(commitId).then((doc) => doc.content)
  }

  private _validate(content: Record<string, any>, schema: SchemaObject): void {
    console.log("WE HAVE THE MODEL, NOW VALIDATING CONTENT!!!")
    console.log("CONTENT", content)
    console.log("SCHEMA", schema)

    const isValid = this._validator.validate(schema, content)
    if (!isValid) {
      const errorMessages = this._validator.errorsText()
      throw new Error(`Validation Error: ${errorMessages}`)
    }
  }
}
