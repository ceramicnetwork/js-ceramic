import { signTx, Tx, SignMeta, createWalletFromMnemonic, Wallet, StdTx } from '@tendermint/sig';
import { CosmosAuthProvider } from '../cosmos';

const did = 'did:3:bafysdfwefwe';
const mnemonic = 'test salon husband push melody usage fine ensure blade deal miss twin';
const local_provider = createWalletFromMnemonic(mnemonic);

class CosmosMockSigner {
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

beforeAll(() => {
  global.Date.now = jest.fn().mockImplementation(() => 666000);
});

afterAll(() => {
  jest.clearAllMocks();
});

describe('Blockchain: Cosmos', () => {
  describe('createLink', () => {
    test('create proof for cosmoshub3', async () => {
      const provider = new CosmosMockSigner(local_provider);
      const authProvider = new CosmosAuthProvider(
        provider,
        local_provider.address
      );
      const proof = await authProvider.createLink(did);
      expect(proof).toMatchSnapshot();
    });
  });

  describe('authenticate', () => {
    test('create proof for cosmoshub3', async () => {
      const provider = new CosmosMockSigner(local_provider);
      const authProvider = new CosmosAuthProvider(
        provider,
        local_provider.address
      );
      const result = await authProvider.authenticate('msg');
      expect(result).toMatchSnapshot();
    });
  });

});