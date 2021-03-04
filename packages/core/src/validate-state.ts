import Utils from './utils';
import { CommitID } from '@ceramicnetwork/docid';
import { DocNext, DocOpts, DocState, Doctype } from '@ceramicnetwork/common';

type LoadDocumentFunc = <T extends Doctype>(docId: CommitID, opts?: DocOpts) => Promise<T>;

/**
 * Loads schema by ID
 *
 * @param loadDocument - Load Ceramic document
 * @param schemaDocId - Schema document ID
 */
async function loadSchemaById<T extends any>(loadDocument: LoadDocumentFunc, schemaDocId: string): Promise<T | null> {
  let commitId: CommitID;
  try {
    commitId = CommitID.fromString(schemaDocId);
  } catch {
    throw new Error('Commit missing when loading schema document');
  }
  const schemaDoc = await loadDocument(commitId);
  return schemaDoc.content;
}

/**
 * Loads schema for the Doctype
 */
async function loadSchema<T extends any>(loadDocument: LoadDocumentFunc, state: DocState | DocNext): Promise<T | null> {
  const schemaId = state.metadata?.schema;
  if (schemaId) {
    return loadSchemaById(loadDocument, schemaId);
  } else {
    return null;
  }
}

/**
 * Validate document state against its schema.
 */
export async function validateState(
  state: DocState | DocNext,
  content: any,
  loadDocument: LoadDocumentFunc,
): Promise<void> {
  const schema = await loadSchema(loadDocument, state);
  if (schema) {
    Utils.validate(content, schema);
  }
}
