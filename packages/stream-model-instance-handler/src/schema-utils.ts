import { CeramicApi } from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'
import ajv, { SchemaObject } from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { Model } from '@ceramicnetwork/stream-model'

export interface SchemaValidationInterface {
  validateSchema(
    ceramic: CeramicApi,
    content: Record<string, any>,
    schemaStreamId: string
  ): Promise<void>
}

export class DummySchemaValidation implements SchemaValidationInterface {
  validateSchema(
    ceramic: CeramicApi,
    content: Record<string, any>,
    schemaStreamId: string
  ): Promise<void> {
    return
  }
}

/**
 * Simple wrapper around AJV library for doing json-schema validation.
 * TODO: Move schema stream loading out of this.
 */
export class SchemaValidation implements SchemaValidationInterface {
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
    const modelStream = await this._loadSchemaById(ceramic, schemaStreamId)
    this._validate(content, modelStream.content.schema)
  }

  private async _loadSchemaById<T>(ceramic: CeramicApi, schemaStreamId: string): Promise<Model | null> {
    try {
      console.log("CommitID.fromString(schemaStreamId)", schemaStreamId)
      return ceramic.loadStream(StreamID.fromString(schemaStreamId))
    } catch(e) {
      throw new Error(`Can't load MID's model stream from stream id`)
    }
  }

  private _validate(content: Record<string, any>, schema: SchemaObject): void {
    const isValid = this._validator.validate(schema, content)
    if (!isValid) {
      const errorMessages = this._validator.errorsText()
      throw new Error(`Validation Error: ${errorMessages}`)
    }
  }
}
