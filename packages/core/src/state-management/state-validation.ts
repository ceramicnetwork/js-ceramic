import { DocNext, DocState, Doctype } from '@ceramicnetwork/common';
import { CommitID } from '@ceramicnetwork/docid';
import Utils from '../utils';

type LoadDocumentFunc = <T extends Doctype>(docId: CommitID) => Promise<T>;

/**
 * Validate document state against its schema.
 */
export class StateValidation {
  constructor(private readonly loadDocument: LoadDocumentFunc) {}

  /**
   * Load schema by ID
   *
   * @param schemaDocId - Schema document ID
   */
  private loadSchemaById<T extends any>(schemaDocId: string): Promise<T | null> {
    let commitId: CommitID;
    try {
      commitId = CommitID.fromString(schemaDocId);
    } catch {
      throw new Error('Commit missing when loading schema document');
    }
    return this.loadDocument(commitId).then((doc) => doc.content);
  }

  /**
   * Load schema for the Doctype
   */
  private async loadSchema<T extends any>(state: DocState | DocNext): Promise<T | null> {
    const schemaId = state.metadata?.schema;
    if (schemaId) {
      return this.loadSchemaById(schemaId);
    } else {
      return null;
    }
  }

  /**
   * Validate document state against its schema.
   */
  async validate(state: DocState | DocNext, content: any): Promise<void> {
    const schema = await this.loadSchema(state);
    if (schema) {
      Utils.validate(content, schema);
    }
  }
}
