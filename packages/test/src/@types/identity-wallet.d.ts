
declare module 'identity-wallet' {
  export default class IdentityWallet {
    constructor (getConsent: () => Promise<boolean>, opts: any)

    get3idProvider (): any;
  }
}
