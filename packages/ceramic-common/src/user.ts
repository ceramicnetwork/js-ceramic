export interface User {

  DID: string;

  publicKeys: any;

  auth (): Promise<void>;

  sign (payload: any, opts?: any): Promise<string>;

}
