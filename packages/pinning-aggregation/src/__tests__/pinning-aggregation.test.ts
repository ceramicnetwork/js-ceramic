import CID from "cids";
import {
  PinningAggregation,
  UnknownPinningService,
} from "../index";
import {
  CidList,
  PinningBackend,
  PinningInfo,
  Context,
} from "@ceramicnetwork/common";
import { IpfsPinning } from "@ceramicnetwork/pinning-ipfs-backend";
import { PowergatePinningBackend } from "@ceramicnetwork/pinning-powergate-backend";

const cid = new CID("QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D");

const context = ({
    ipfs: jest.fn(),
} as unknown) as Context;

const token = "p0W3R9473_70K3N";
const doubleFakeConnectionStrings = ["fake://alpha.com", "fake://beta.com"];

class FakePinning implements PinningBackend {
    static designator = "fake";

    readonly id = `fake@${this.connectionString}`;

    static async build(connectionString: string): Promise<FakePinning> {
        return new FakePinning(connectionString);
    }

    constructor(readonly connectionString: string) {}

    async close(): Promise<void> {
        // Do Nothing
    }

    open(): void {
        // Do Nothing
    }

    async pin(): Promise<void> {
        // Do Nothing
    }

    async unpin(): Promise<void> {
        // Do Nothing
    }

    async ls(): Promise<CidList> {
        return {
            [cid.toString()]: [this.id],
        };
    }

    async info(): Promise<PinningInfo> {
        return {
            [this.id]: {
                connectionString: this.connectionString,
            },
        };
    }
}

describe("constructor", () => {
    test("init pinning backends", async () => {
        const connectionStrings = ["ipfs+context", "ipfs+https://example.com", `powergate://localhost:5002?token=${token}`, `powergate+https://example.com?token=${token}`,];
        const aggregation = PinningAggregation.build(context, connectionStrings, [IpfsPinning, PowergatePinningBackend,]);
        expect(aggregation.backends.length).toEqual(4);

        expect(aggregation.backends[0]).toBeInstanceOf(IpfsPinning);
        const zero = aggregation.backends[0] as IpfsPinning;
        expect(zero.ipfsAddress).toEqual("ipfs+context");

        expect(aggregation.backends[1]).toBeInstanceOf(IpfsPinning);
        const one = aggregation.backends[1] as IpfsPinning;
        expect(one.ipfsAddress).toEqual("https://example.com:5001");

        expect(aggregation.backends[2]).toBeInstanceOf(PowergatePinningBackend);
        const two = aggregation.backends[2] as PowergatePinningBackend;
        expect(two.endpoint).toEqual("http://localhost:5002");
        expect(two.token).toEqual(token);

        expect(aggregation.backends[3]).toBeInstanceOf(PowergatePinningBackend);
        const three = aggregation.backends[3] as PowergatePinningBackend;
        expect(three.endpoint).toEqual("https://example.com:6002");
        expect(three.token).toEqual(token);
    });

    test("unknown designator", async () => {
        const connectionStrings = ["foo://localhost:5001"];
        expect(() => {
            PinningAggregation.build(context, connectionStrings);
        }).toThrow(UnknownPinningService);
    });

    test("mangled designator", async () => {
        const connectionStrings = ["foo+ipfs://example.com"];
        expect(() => {
            PinningAggregation.build(context, connectionStrings);
        }).toThrow(UnknownPinningService);
    });
});

describe("#open", () => {
    test("call all backends", async () => {
        const aggregation = PinningAggregation.build(context, doubleFakeConnectionStrings, [FakePinning]);
        expect(aggregation.backends.length).toEqual(2);
        expect(aggregation.backends[0]).toBeInstanceOf(FakePinning);
        expect(aggregation.backends[1]).toBeInstanceOf(FakePinning);
        aggregation.backends[0].open = jest.fn();
        aggregation.backends[1].open = jest.fn();
        await aggregation.open();
        expect(aggregation.backends[0].open).toBeCalled();
        expect(aggregation.backends[1].open).toBeCalled();
    });

    test("throw if backend fails", async () => {
        const aggregation = PinningAggregation.build(context, doubleFakeConnectionStrings, [FakePinning]);
        aggregation.backends[0].open = jest.fn(() => {
            throw new Error(`oops`);
        });
        aggregation.backends[1].open = jest.fn();
        await expect(aggregation.open()).rejects.toThrow("oops");
    });
});

describe("#close", () => {
    test("call all backends", async () => {
        const aggregation = PinningAggregation.build(context, doubleFakeConnectionStrings, [FakePinning]);
        expect(aggregation.backends.length).toEqual(2);
        expect(aggregation.backends[0]).toBeInstanceOf(FakePinning);
        expect(aggregation.backends[1]).toBeInstanceOf(FakePinning);
        aggregation.backends[0].close = jest.fn();
        aggregation.backends[1].close = jest.fn();
        await aggregation.close();
        expect(aggregation.backends[0].close).toBeCalled();
        expect(aggregation.backends[1].close).toBeCalled();
    });

    test("throw if backend fails", async () => {
        const aggregation = PinningAggregation.build(context, doubleFakeConnectionStrings, [FakePinning]);
        aggregation.backends[0].close = jest.fn(() => {
            throw new Error(`oops`);
        });
        aggregation.backends[1].close = jest.fn();
        await expect(aggregation.close()).rejects.toThrow("oops");
    });
});

describe("#pin", () => {
    test("call all backends", async () => {
        const aggregation = PinningAggregation.build(context, doubleFakeConnectionStrings, [FakePinning]);
        expect(aggregation.backends.length).toEqual(2);
        expect(aggregation.backends[0]).toBeInstanceOf(FakePinning);
        expect(aggregation.backends[1]).toBeInstanceOf(FakePinning);
        aggregation.backends[0].pin = jest.fn();
        aggregation.backends[1].pin = jest.fn();
        await aggregation.pin(cid);
        expect(aggregation.backends[0].pin).toBeCalled();
        expect(aggregation.backends[1].pin).toBeCalled();
    });

    test("throw if backend fails", async () => {
        const aggregation = PinningAggregation.build(context, doubleFakeConnectionStrings, [FakePinning]);
        aggregation.backends[0].pin = jest.fn(() => {
            throw new Error(`oops`);
        });
        aggregation.backends[1].pin = jest.fn();
        await expect(aggregation.pin(cid)).rejects.toThrow("oops");
    });
});

describe("#unpin", () => {
    test("call all backends", async () => {
        const aggregation = PinningAggregation.build(context, doubleFakeConnectionStrings, [FakePinning]);
        expect(aggregation.backends.length).toEqual(2);
        expect(aggregation.backends[0]).toBeInstanceOf(FakePinning);
        expect(aggregation.backends[1]).toBeInstanceOf(FakePinning);
        aggregation.backends[0].unpin = jest.fn();
        aggregation.backends[1].unpin = jest.fn();
        await aggregation.unpin(cid);
        expect(aggregation.backends[0].unpin).toBeCalled();
        expect(aggregation.backends[1].unpin).toBeCalled();
    });

    test("resolve if backend fails", async () => {
        const aggregation = PinningAggregation.build(context, doubleFakeConnectionStrings, [FakePinning]);
        aggregation.backends[0].unpin = jest.fn(() => {
            throw new Error(`oops`);
        });
        aggregation.backends[1].unpin = jest.fn();
        await expect(aggregation.unpin(cid)).resolves.toBeUndefined();
    });
});

describe("#ls", () => {
    test("merge backend designators", async () => {
        const aggregation = PinningAggregation.build(context, doubleFakeConnectionStrings, [FakePinning]);
        const result = await aggregation.ls();
        const ids = aggregation.backends.map((b) => b.id);
        expect(result[cid.toString()]).toEqual(ids);
    });
});

test("#id", async () => {
    const aggregation = PinningAggregation.build(context, doubleFakeConnectionStrings, [FakePinning]);
    expect(aggregation.id).toEqual("pinning-aggregation@MrsSJQiu_jyU4eUHlnStwE1_xiyF7aEz8OljvySd4Tk=");
});

describe("#info", () => {
    test("return random info", async () => {
        const aggregation = PinningAggregation.build(context, doubleFakeConnectionStrings, [FakePinning]);
        const info = await aggregation.info();
        expect(info).toEqual({
            [aggregation.backends[0].id]: {
                connectionString: doubleFakeConnectionStrings[0],
            }, [aggregation.backends[1].id]: {
                connectionString: doubleFakeConnectionStrings[1],
            },
        });
    });
});
