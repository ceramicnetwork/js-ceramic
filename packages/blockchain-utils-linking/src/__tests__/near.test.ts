import { NearAuthProvider } from '../near';
import { KeyPair } from 'near-api-js';
import * as uint8arrays from 'uint8arrays';

const did = 'did:3:bafysdfwefwe';
const privateKey = 'ed25519:9hB3onqC56qBSHpHJaE6EyxKPyFxCxzRBkmjuVx6UqXwygvAmFbwnsLuZ2YHsYJqkPTCygVBwXpNzssvWvUySbd';
const local_provider = KeyPair.fromString(privateKey);
const chainRef = 'near-testnet';

class NearMockSigner {
  readonly provider: KeyPair;

  constructor(local_provider: KeyPair) {
    this.provider = local_provider;
  }

  public async sign(message: String): Promise<{ signature: String, account: String }> {
    const { signature, publicKey } = await this.provider.sign(
      uint8arrays.fromString(message)
    );
    return {
      signature: uint8arrays.toString(signature, 'base64pad'),
      account: uint8arrays.toString(publicKey.data, 'base64pad'),
    };
  }
}

beforeAll(() => {
  global.Date.now = jest.fn().mockImplementation(() => 666000);
});

afterAll(() => {
  jest.clearAllMocks();
});

describe('Blockchain: NEAR', () => {
  describe('createLink', () => {
    test(`create proof for ${chainRef}`, async () => {
      const provider = new NearMockSigner(local_provider);
      const authProvider = new NearAuthProvider(
        provider,
        local_provider.getPublicKey().toString(),
        chainRef
      );
      const proof = await authProvider.createLink(did);
      expect(proof).toMatchSnapshot();
    });
  });

  describe('authenticate', () => {
    test(`create proof for ${chainRef}`, async () => {
      const provider = new NearMockSigner(local_provider);
      const authProvider = new NearAuthProvider(
        provider,
        local_provider.getPublicKey().toString(),
        chainRef
      );
      const result = await authProvider.authenticate('msg');
      expect(result).toMatchSnapshot();
    });
  });

  describe('authenticate', () => {
    test(`entropy replication for ${chainRef}`, async () => {
      const provider = new NearMockSigner(local_provider);
      const authProvider = new NearAuthProvider(
        provider,
        local_provider.getPublicKey().toString(),
        chainRef
      );
      const msg = 'hello'
      const control = await authProvider.authenticate(msg);
      await expect(authProvider.authenticate(msg)).resolves.toEqual(control);
      await expect(authProvider.authenticate(msg)).resolves.toEqual(control);
    });
  });

});