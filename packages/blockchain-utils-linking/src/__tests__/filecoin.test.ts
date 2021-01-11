import { LocalManagedProvider } from "@glif/local-managed-provider";
import { Network } from "@glif/filecoin-address";
import { FilecoinAuthProvider } from "../filecoin";

const did = "did:3:bafysdfwefwe";
const testnetPrivateKey =
  "7b2254797065223a22736563703235366b31222c22507269766174654b6579223a2257587362654d5176487a366f5668344b637262633045642b31362b3150766a6a504f3753514931355031343d227d";
const mainnetPrivateKey =
  "7b2254797065223a22736563703235366b31222c22507269766174654b6579223a2257587362654d5176487a366f5668344b637262633045642b31362b3150766a6a554f3753514931355031343d227d";
const blsPrivateKey =
  "7b2254797065223a22626c73222c22507269766174654b6579223a226e586841424f4163796856504b48326155596261796f4475752f4c6f32515a2b6662622f6f736a2f34456f3d227d";
const testnetProvider = new LocalManagedProvider(
  testnetPrivateKey,
  Network.TEST
);
const mainnetProvider = new LocalManagedProvider(
  mainnetPrivateKey,
  Network.MAIN
);
const blsMainnetProvider = new LocalManagedProvider(
  blsPrivateKey,
  Network.MAIN
);

beforeAll(() => {
  global.Date.now = jest.fn().mockImplementation(() => 666);
});

afterAll(() => {
  jest.clearAllMocks();
});

describe("accountId", () => {
  test("handle testnet", async () => {
    const addresses = await testnetProvider.getAccounts();
    const authProvider = new FilecoinAuthProvider(
      testnetProvider,
      addresses[0]
    );
    const accountId = await authProvider.accountId();
    expect(accountId).toMatchSnapshot();
  });
  test("handle mainnet", async () => {
    const addresses = await mainnetProvider.getAccounts();
    const authProvider = new FilecoinAuthProvider(
      mainnetProvider,
      addresses[0]
    );
    const accountId = await authProvider.accountId();
    expect(accountId).toMatchSnapshot();
  });
  test("handle bls mainnet", async () => {
    const addresses = await blsMainnetProvider.getAccounts();
    const authProvider = new FilecoinAuthProvider(
      blsMainnetProvider,
      addresses[0]
    );
    const accountId = await authProvider.accountId();
    expect(accountId).toMatchSnapshot();
  });
});

describe("authenticate", () => {
  test("testnet", async () => {
    const addresses = await testnetProvider.getAccounts();
    const authProvider = new FilecoinAuthProvider(
      testnetProvider,
      addresses[0]
    );
    await expect(authProvider.authenticate("msg")).resolves.toMatchSnapshot();
  });

  test("mainnet", async () => {
    const addresses = await mainnetProvider.getAccounts();
    const authProvider = new FilecoinAuthProvider(
      mainnetProvider,
      addresses[0]
    );
    await expect(authProvider.authenticate("msg")).resolves.toMatchSnapshot();
  });

  test("mainnet BLS", async () => {
    const addresses = await blsMainnetProvider.getAccounts();
    const authProvider = new FilecoinAuthProvider(
      blsMainnetProvider,
      addresses[0]
    );
    await expect(authProvider.authenticate("msg")).resolves.toMatchSnapshot();
  });

  test("address mismatch", async () => {
    const addresses = await blsMainnetProvider.getAccounts();
    const authProvider = new FilecoinAuthProvider(
      mainnetProvider,
      addresses[0]
    );
    await expect(authProvider.authenticate("msg")).rejects.toThrow();
  });
});

describe("createLink", () => {
  test("generate proof on testnet", async () => {
    const addresses = await testnetProvider.getAccounts();
    const authProvider = new FilecoinAuthProvider(
      testnetProvider,
      addresses[0]
    );
    const proof = await authProvider.createLink(did);
    expect(proof).toMatchSnapshot();
  });

  test("generate proof on mainnet", async () => {
    const addresses = await mainnetProvider.getAccounts();
    const authProvider = new FilecoinAuthProvider(
      mainnetProvider,
      addresses[0]
    );
    const proof = await authProvider.createLink(did);
    expect(proof).toMatchSnapshot();
  });

  test("generate proof on mainnet for BLS key", async () => {
    const addresses = await blsMainnetProvider.getAccounts();
    const authProvider = new FilecoinAuthProvider(
      blsMainnetProvider,
      addresses[0]
    );
    const proof = await authProvider.createLink(did);
    expect(proof).toMatchSnapshot();
  });

  test("fail on mainnet address for testnet provider", async () => {
    const addresses = await mainnetProvider.getAccounts();
    const authProvider = new FilecoinAuthProvider(
      testnetProvider,
      addresses[0]
    );
    await expect(authProvider.createLink(did)).rejects.toThrow();
  });
  test("fail on testnet address for mainnet provider", async () => {
    const addresses = await testnetProvider.getAccounts();
    const authProvider = new FilecoinAuthProvider(
      mainnetProvider,
      addresses[0]
    );
    await expect(authProvider.createLink(did)).rejects.toThrow();
  });
});

test("withAddress", async () => {
  const addresses = await testnetProvider.getAccounts();
  const authProvider = new FilecoinAuthProvider(mainnetProvider, addresses[0]);
  const currentAccount = await authProvider.accountId();
  expect(currentAccount).toMatchSnapshot();
  const nextProvider = authProvider.withAddress("f123");
  const nextAccount = await nextProvider.accountId();
  expect(nextAccount).toMatchSnapshot();
  expect(nextAccount).not.toEqual(currentAccount);
});
