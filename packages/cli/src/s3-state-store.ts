import { DocState, Doctype, DoctypeUtils } from "@ceramicnetwork/common"
import DocID from '@ceramicnetwork/docid'
import { StateStore } from "@ceramicnetwork/core";
import LevelUp from "levelup";
import S3LevelDOWN from "s3leveldown"
import AWS from "aws-sdk"
import toArray from "stream-to-array"

/**
 * Ceramic store for saving document state to S3
 */
export class S3StateStore implements StateStore {
  readonly #bucketName: string
  readonly #awsRegion: string
  readonly #awsAccessKeyId: string
  readonly #awsSecretAccessKey: string

  #store

  constructor(bucketName: string, awsRegion: string, awsAccessKeyId: string, awsSecretAccessKey: string) {
    this.#bucketName = bucketName
    this.#awsRegion = awsRegion
    this.#awsAccessKeyId = awsAccessKeyId
    this.#awsSecretAccessKey = awsSecretAccessKey
  }

  /**
   * Open pinning service
   */
  async open(): Promise<void> {
    AWS.config.update({ region: this.#awsRegion });
    const s3 = new AWS.S3({
      accessKeyId: this.#awsAccessKeyId,
      secretAccessKey: this.#awsSecretAccessKey,
      apiVersion: '2006-03-01',
      s3ForcePathStyle: true,
      signatureVersion: 'v4'
    });
    this.#store = new LevelUp(new S3LevelDOWN(this.#bucketName, s3));
  }

  /**
   * Pin document
   * @param document - Document instance
   */
  async save(document: Doctype): Promise<void> {
    await this.#store.put(document.id.baseID.toString(), JSON.stringify(DoctypeUtils.serializeState(document.state)))
  }

  /**
   * Load document state
   * @param docId - Document ID
   */
  async load(docId: DocID): Promise<DocState> {
    try {
      const state = await this.#store.get(docId.baseID.toString())
      if (state) {
        return DoctypeUtils.deserializeState(JSON.parse(state));
      } else {
        return null;
      }
    } catch (err) {
      if (err.notFound) {
        return null // return null for non-existent entry
      }
      throw err
    }
  }

  /**
   * Unpin document
   * @param docId - Document ID
   */
  async remove(docId: DocID): Promise<void> {
    await this.#store.del(docId.baseID.toString())
  }

  /**
   * List pinned document
   * @param docId - Document ID
   */
  async list(docId?: DocID): Promise<string[]> {
    if (docId == null) {
      const bufArray = await toArray(this.#store.createKeyStream())
      return bufArray.map((buf) => buf.toString())
    }  else {
      const exists = Boolean(await this.load(docId.baseID))
      return exists ? [docId.toString()] : []
    }
  }

  /**
   * Close pinning service
   */
  async close(): Promise<void> {
    this.#store.close()
  }
}
