import { KeyPair } from 'near-api-js';
import { validateLink } from '../near';
import * as linking from "@ceramicnetwork/blockchain-utils-linking";
import * as uint8arrays from 'uint8arrays';

enum KeyType {
  ED25519 = 0,
}

interface PublicKey {
  keyType: KeyType;
  data: Uint8Array;
}

interface Signature {
  signature: Uint8Array;
  publicKey: PublicKey;
}

const did = 'did:3:bafysdfwefwe';
const privateKey = 'ed25519:9hB3onqC56qBSHpHJaE6EyxKPyFxCxzRBkmjuVx6UqXwygvAmFbwnsLuZ2YHsYJqkPTCygVBwXpNzssvWvUySbd';
const local_provider = KeyPair.fromString(privateKey);
const chainRef = 'near-mainnet';

class NearMockSigner {
  readonly provider: KeyPair;

  constructor(local_provider: KeyPair) {
    this.provider = local_provider;
  }

  public async sign(message: String): Promise<Signature>{
    return new Promise((resolve): void => {
      const signature = this.provider.sign(
        uint8arrays.fromString(message)
      );
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
        local_provider.getPublicKey(),
        chainRef
      );
      const proof = await authProvider.createLink(did);
      await expect(validateLink(proof)).resolves.toEqual(proof);
    });
  });
});