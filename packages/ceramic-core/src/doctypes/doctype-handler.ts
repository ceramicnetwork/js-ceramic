import type User from '../user'
import type CID from 'cids'
import { AnchorProof, AnchorRecord, DocState } from "../doctype"

abstract class DoctypeHandler {
  protected _user: User

  constructor (private _doctype: string) {}

  get doctype (): string {
    return this._doctype
  }

  set user (user: User) {
    this._user = user
  }

  get user (): User {
    return this._user
  }

  abstract async applyGenesis (record: any, cid: CID): Promise<DocState>;

  abstract async applySigned (record: any, cid: CID, state: DocState): Promise<DocState>;

  abstract async applyAnchor (record: AnchorRecord, proof: AnchorProof, cid: CID, state: DocState): Promise<DocState>;

  abstract async makeRecord (state: DocState, newContent: any, newOwners?: Array<string>): Promise<any>;

  abstract async makeGenesis (content: any, owners?: Array<string>, opts?: { isUnique?: boolean }): Promise<any>;
}

export default DoctypeHandler
