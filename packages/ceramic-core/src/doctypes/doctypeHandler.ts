import { DocState } from '../document'
import User from '../user'

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

  abstract async applyRecord (record: any, cid: string, state?: DocState): Promise<DocState>;

  abstract async makeRecord (state: DocState, newContent: any): Promise<any>;

  abstract async makeGenesis (content: any, owners?: Array<string>): Promise<any>;
}

export default DoctypeHandler
