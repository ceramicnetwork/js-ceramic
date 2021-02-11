import { EOSIOProvider } from "@smontero/eosio-local-provider";
import { validateLink } from "../eosio";
import { AccountID } from "caip";
import * as linking from "@ceramicnetwork/blockchain-utils-linking";

jest.setTimeout(15000);

const did = "did:3:bafysdfwefwe";
const telosTestnetChainId =
  "1eaa0824707c8c16bd25145493bf062aecddfeb56c736f6ba6397f3195f33c9f";
const jungleChainId =
  "2a02a0053e5a8cf73a56ba0fda11e4d92e0238a4a2aa74fccf46d5a910746840";
const telosTestnetCAIPChainId = "1eaa0824707c8c16bd25145493bf062a";
const jungleCAIPChainId = "2a02a0053e5a8cf73a56ba0fda11e4d9";
const invalidCAIPChainId = "11111111111111111111111111111111";
const telosTestnetAccount = "testuser1111";
const jungleAccount = "idx3idctest1";
const telosTestnetProvider = new EOSIOProvider({
  chainId: telosTestnetChainId,
  account: telosTestnetAccount,
  keys: {
    EOS6uUc8fYoCdyz7TUAXqHvRbU7QnVirFuvcAW6NMQqBabdME6FnL:
      "5KFFFvKioakMpt8zWnyGKnLaDzzUSqy5V33PHHoxEam47pLJmo2",
  },
});
const jungleProvider = new EOSIOProvider({
  chainId: jungleChainId,
  account: jungleAccount,
  keys: {
    EOS7f7hdusWKXY1cymDLvUL3m6rTLKmdyPi4e6kquSnmfVxxEwVcC:
      "5JRzDcbMqvTJxjHeP8vZqZbU9PwvaaTsoQhoVTAs3xBVSZaPB9U",
  },
});

describe("validateLink", () => {
  test("Telos testnet", async () => {
    const authProvider = new linking.eosio.EosioAuthProvider(
      telosTestnetProvider,
      telosTestnetAccount
    );
    const proof = await authProvider.createLink(did);
    await expect(validateLink(proof)).resolves.toEqual(proof);

    let testAccount = new AccountID(
      `${jungleAccount}@eosio:${jungleCAIPChainId}`
    );
    proof.account = testAccount.toString();
    await expect(validateLink(proof)).resolves.toEqual(null);

    testAccount = new AccountID(
      `${jungleAccount}@eosio:${telosTestnetCAIPChainId}`
    );
    proof.account = testAccount.toString();
    await expect(validateLink(proof)).resolves.toEqual(null);

    testAccount = new AccountID(`${jungleAccount}@eosio:${invalidCAIPChainId}`);
    proof.account = testAccount.toString();
    await expect(validateLink(proof)).rejects.toThrow(`No node found for chainId: ${invalidCAIPChainId}`)
  });

  test("Jungle", async () => {
    const authProvider = new linking.eosio.EosioAuthProvider(
      jungleProvider,
      jungleAccount
    );
    const proof = await authProvider.createLink(did);
    await expect(validateLink(proof)).resolves.toEqual(proof);

    let testAccount = new AccountID(
      `${telosTestnetAccount}@eosio:${telosTestnetCAIPChainId}`
    );
    proof.account = testAccount.toString();
    await expect(validateLink(proof)).resolves.toEqual(null);

    testAccount = new AccountID(
      `${telosTestnetAccount}@eosio:${jungleCAIPChainId}`
    );
    proof.account = testAccount.toString();
    await expect(validateLink(proof)).resolves.toEqual(null);

    testAccount = new AccountID(
      `${telosTestnetAccount}@eosio:${invalidCAIPChainId}`
    );
    proof.account = testAccount.toString();
    await expect(validateLink(proof)).rejects.toThrow(`No node found for chainId: ${invalidCAIPChainId}`)
  });
});
