<<<<<<< HEAD
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
=======
import { NearAuthProvider } from '../near'
import { KeyPair } from 'near-api-js'
import * as uint8arrays from 'uint8arrays'

const did = 'did:3:bafysdfwefwe'
const privateKey =
  'ed25519:9hB3onqC56qBSHpHJaE6EyxKPyFxCxzRBkmjuVx6UqXwygvAmFbwnsLuZ2YHsYJqkPTCygVBwXpNzssvWvUySbd'
const local_provider = KeyPair.fromString(privateKey)
const chainRef = 'near-mainnet'

class NearMockSigner {
  readonly provider: KeyPair

  constructor(local_provider: KeyPair) {
    this.provider = local_provider
  }

  public async sign(message: String): Promise<{ signature: String; account: String }> {
    const { signature, publicKey } = await this.provider.sign(uint8arrays.fromString(message))
    return {
      signature: uint8arrays.toString(signature, 'base64pad'),
      account: uint8arrays.toString(publicKey.data, 'base64pad'),
    }
>>>>>>> 4267d8b31fca38a163bb009198a49e1de22b2a58
  }
}

beforeAll(() => {
<<<<<<< HEAD
  global.Date.now = jest.fn().mockImplementation(() => 666000);
});

afterAll(() => {
  jest.clearAllMocks();
});
=======
  global.Date.now = jest.fn().mockImplementation(() => 666000)
})

afterAll(() => {
  jest.clearAllMocks()
})
>>>>>>> 4267d8b31fca38a163bb009198a49e1de22b2a58

describe('Blockchain: NEAR', () => {
  describe('createLink', () => {
    test(`create proof for ${chainRef}`, async () => {
<<<<<<< HEAD
      const provider = new NearMockSigner(local_provider);
=======
      const provider = new NearMockSigner(local_provider)
>>>>>>> 4267d8b31fca38a163bb009198a49e1de22b2a58
      const authProvider = new NearAuthProvider(
        provider,
        local_provider.getPublicKey().toString(),
        chainRef
<<<<<<< HEAD
      );
      const proof = await authProvider.createLink(did);
      expect(proof).toMatchSnapshot();
    });
  });

  describe('authenticate', () => {
    test(`create proof for ${chainRef}`, async () => {
      const provider = new NearMockSigner(local_provider);
=======
      )
      const proof = await authProvider.createLink(did)
      expect(proof).toMatchSnapshot()
    })
  })

  describe('authenticate', () => {
    test(`create proof for ${chainRef}`, async () => {
      const provider = new NearMockSigner(local_provider)
>>>>>>> 4267d8b31fca38a163bb009198a49e1de22b2a58
      const authProvider = new NearAuthProvider(
        provider,
        local_provider.getPublicKey().toString(),
        chainRef
<<<<<<< HEAD
      );
      const result = await authProvider.authenticate('msg');
      expect(result).toMatchSnapshot();
    });
  });

  describe('authenticate', () => {
    test(`entropy replication for ${chainRef}`, async () => {
      const provider = new NearMockSigner(local_provider);
=======
      )
      const result = await authProvider.authenticate('msg')
      expect(result).toMatchSnapshot()
    })
  })

  describe('authenticate', () => {
    test(`entropy replication for ${chainRef}`, async () => {
      const provider = new NearMockSigner(local_provider)
>>>>>>> 4267d8b31fca38a163bb009198a49e1de22b2a58
      const authProvider = new NearAuthProvider(
        provider,
        local_provider.getPublicKey().toString(),
        chainRef
<<<<<<< HEAD
      );
      const msg = 'hello'
      const control = await authProvider.authenticate(msg);
      await expect(authProvider.authenticate(msg)).resolves.toEqual(control);
      await expect(authProvider.authenticate(msg)).resolves.toEqual(control);
    });
  });

});
=======
      )
      const msg = 'hello'
      expect(await authProvider.authenticate(msg)).toMatchSnapshot()
      expect(await authProvider.authenticate(msg)).toMatchSnapshot()
    })
  })
})
>>>>>>> 4267d8b31fca38a163bb009198a49e1de22b2a58
