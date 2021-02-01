import { signTx, Tx, SignMeta, createWalletFromMnemonic, Wallet, StdTx } from '@tendermint/sig';
import { validateLink } from '../near';
import * as linking from "@ceramicnetwork/blockchain-utils-linking";

const did = 'did:3:bafysdfwefwe';
const mnemonic = 'test salon husband push melody usage fine ensure blade deal miss twin';
const local_provider = createWalletFromMnemonic(mnemonic);
const chainRef = 'near-mainnet';

class NearMockSigner {
  readonly provider: Wallet;

  constructor(local_provider: Wallet) {
    this.provider = local_provider;
  }

  public async sign(msg : Tx, metadata : SignMeta) : Promise<StdTx>{
    return new Promise((resolve): void => {
      const signature = signTx(msg, metadata, this.provider);
      resolve(signature);
    }); 
  }
}

describe('Blockchain: Near', () => {
  describe('validateLink', () => {
    test(`validate proof for ${chainRef}`, async () => {
      const provider = new NearMockSigner(local_provider);
      const authProvider = new linking.near.NearAuthProvider(
        provider,
        local_provider.address,
        chainRef
      );
      const proof = await authProvider.createLink(did);
      await expect(validateLink(proof)).resolves.toEqual(proof);
    });
  });
});