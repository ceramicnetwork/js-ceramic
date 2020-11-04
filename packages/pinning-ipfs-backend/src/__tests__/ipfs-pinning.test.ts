import ipfsClient from "ipfs-http-client"
import CID from "cids";
import { IpfsPinning, NoIpfsInstanceError } from "../index";
import { asyncIterableFromArray } from "./async-iterable-from-array.util";
import { Context } from "@ceramicnetwork/common"

jest.mock("ipfs-http-client");

beforeEach(() => {
    (ipfsClient as any).mockClear();
});

describe("constructor", () => {
    test("set IPFS address to ipfs+context", () => {
        const pinning = new IpfsPinning("ipfs+context", {});
        expect(pinning.ipfsAddress).toEqual("ipfs+context");
    });
    test("set IPFS address from ipfs+http protocol", () => {
        const pinning = new IpfsPinning("ipfs+http://example.com", {});
        expect(pinning.ipfsAddress).toEqual("http://example.com:5001");
    });
    test("set IPFS address from ipfs+https protocol", () => {
        const pinning = new IpfsPinning("ipfs+https://example.com", {});
        expect(pinning.ipfsAddress).toEqual("https://example.com:5001");
    });
});

describe("#open", () => {
    test("use IPFS from context if __context", async () => {
        const context = ({ ipfs: jest.fn() } as unknown) as Context;
        const pinning = new IpfsPinning("ipfs+context", context);
        await pinning.open();
        expect(pinning.ipfs).toBe(context.ipfs);
    });
    test("throw if no IPFS instance in context", async () => {
        const context = {};
        const pinning = new IpfsPinning("ipfs+context", context);
        await expect(pinning.open.bind(pinning)).rejects.toThrow(NoIpfsInstanceError);
    });
    test("use IPFS client pointed to #ipfsAddress", async () => {
        const pinning = new IpfsPinning("ipfs+https://example.com", {});
        await pinning.open();
        expect(ipfsClient).toBeCalledWith({ url: "https://example.com:5001" });
    });
});

describe("#pin", () => {
    test("call ipfs instance", async () => {
        const add = jest.fn();
        const context = ({
            ipfs: {
                pin: {
                    add: add,
                },
            },
        } as unknown) as Context;
        const pinning = new IpfsPinning("ipfs+context", context);
        await pinning.open();
        const cid = new CID("QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D");
        await pinning.pin(cid);
        expect(add).toBeCalledWith(cid, { recursive: false });
    });

    test("silently pass if no IPFS instance", async () => {
        const context = {} as Context;
        const pinning = new IpfsPinning("ipfs+context", context);
        const cid = new CID("QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D");
        await expect(pinning.pin(cid)).resolves.toBeUndefined();
    });
});

describe("#unpin", () => {
    test("call ipfs instance", async () => {
        const rm = jest.fn();
        const context = ({
            ipfs: {
                pin: {
                    rm: rm,
                },
            },
        } as unknown) as Context;
        const pinning = new IpfsPinning("ipfs+context", context);
        await pinning.open();
        const cid = new CID("QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D");
        await pinning.unpin(cid);
        expect(rm).toBeCalledWith(cid);
    });

    test("silently pass if no IPFS instance", async () => {
        const context = {} as Context;
        const pinning = new IpfsPinning("ipfs+context", context);
        const cid = new CID("QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D");
        await expect(pinning.unpin(cid)).resolves.toBeUndefined();
    });
});

describe("#ls", () => {
    test("return list of cids pinned", async () => {
        const cids = [new CID("QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D"), new CID("QmWXShtJXt6Mw3FH7hVCQvR56xPcaEtSj4YFSGjp2QxA4v"),];
        const lsResult = cids.map((cid) => ({ cid: cid, type: "direct" }));
        const ls = jest.fn(() => asyncIterableFromArray(lsResult));
        const context = ({
            ipfs: {
                pin: {
                    ls: ls,
                },
            },
        } as unknown) as Context;
        const pinning = new IpfsPinning("ipfs+context", context);
        await pinning.open();
        const result = await pinning.ls();
        cids.forEach((cid) => {
            expect(result[cid.toString()]).toEqual([pinning.id]);
        });
    });

    test("return empty array if no ipfs", async () => {
        const context = ({} as unknown) as Context;
        const pinning = new IpfsPinning("ipfs+context", context);
        const result = await pinning.ls();
        expect(result).toEqual({});
    });
});

test("#id", async () => {
    const context = ({} as unknown) as Context;
    const pinning = new IpfsPinning("ipfs+context", context);
    const id = pinning.id;
    expect(id).toEqual("ipfs@KMzaB1J_CpotKvSIzMgcP7laSSnAV2VHux-9_jZ9oQs=");
});

test("#info", async () => {
    const context = ({} as unknown) as Context;
    const pinning = new IpfsPinning("ipfs+context", context);
    const info = await pinning.info();
    expect(info).toEqual({
        "ipfs@KMzaB1J_CpotKvSIzMgcP7laSSnAV2VHux-9_jZ9oQs=": {},
    });
});
