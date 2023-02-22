import * as dagJose from 'dag-jose';
import { path } from 'go-ipfs';
import * as Ctl from 'ipfsd-ctl';
import * as ipfsClient from 'ipfs-http-client';
import { create as createJsIpfs } from 'ipfs-core';
import getPort from 'get-port';
import mergeOpts from 'merge-options';
import tmp from 'tmp-promise';
const mergeOptions = mergeOpts.bind({ ignoreUndefined: true });
const ipfsHttpModule = {
    create: (ipfsEndpoint) => {
        return ipfsClient.create({
            url: ipfsEndpoint,
            ipld: { codecs: [dagJose] },
        });
    },
};
const createFactory = () => {
    return Ctl.createFactory({
        ipfsHttpModule,
    }, {
        go: {
            ipfsBin: path(),
        },
    });
};
export async function createController(ipfsOptions, disposable = true) {
    const ipfsd = await createFactory().spawn({
        type: 'go',
        ipfsOptions,
        disposable,
    });
    if (disposable) {
        return ipfsd;
    }
    return ipfsd.init(ipfsOptions.init);
}
async function createIpfsOptions(override = {}, repoPath) {
    const swarmPort = await getPort();
    const apiPort = await getPort();
    const gatewayPort = await getPort();
    return mergeOptions({
        start: true,
        ipld: { codecs: [dagJose] },
        config: {
            Addresses: {
                Swarm: [`/ip4/127.0.0.1/tcp/${swarmPort}`],
                Gateway: `/ip4/127.0.0.1/tcp/${gatewayPort}`,
                API: `/ip4/127.0.0.1/tcp/${apiPort}`,
            },
            Pubsub: {
                Enabled: true,
            },
            Bootstrap: [],
        },
    }, repoPath ? { repo: `${repoPath}/ipfs${swarmPort}/` } : {}, override);
}
const createInstanceByType = {
    js: (ipfsOptions) => createJsIpfs(ipfsOptions),
    go: async (ipfsOptions, disposable = true) => {
        if (!ipfsOptions.start) {
            throw Error('go IPFS instances must be started');
        }
        const ipfsd = await createController(ipfsOptions, disposable);
        const started = await ipfsd.start();
        return started.api;
    },
};
export async function createIPFS(overrideConfig = {}, disposable = true) {
    const flavor = process.env.IPFS_FLAVOR || 'go';
    if (!overrideConfig.repo) {
        const tmpFolder = await tmp.dir({ unsafeCleanup: true });
        const ipfsOptions = await createIpfsOptions(overrideConfig, tmpFolder.path);
        const instance = await createInstanceByType[flavor](ipfsOptions, disposable);
        return new Proxy(instance, {
            get(target, p) {
                if (p === 'stop') {
                    return () => {
                        const vanilla = target[p];
                        return vanilla().finally(() => tmpFolder.cleanup());
                    };
                }
                return target[p];
            },
        });
    }
    const ipfsOptions = await createIpfsOptions(overrideConfig);
    return createInstanceByType[flavor](ipfsOptions, disposable);
}
export async function swarmConnect(a, b) {
    const addressB = (await b.id()).addresses[0];
    const addressA = (await a.id()).addresses[0];
    await a.swarm.connect(addressB);
    await b.swarm.connect(addressA);
}
export async function withFleet(n, task) {
    const flavor = process.env.IPFS_FLAVOR || 'go';
    if (flavor.toLowerCase() == 'js') {
        return withJsFleet(n, task);
    }
    else {
        return withGoFleet(n, task);
    }
}
async function withGoFleet(n, task, overrideConfig = {}) {
    const factory = createFactory();
    const controllers = await Promise.all(Array.from({ length: n }).map(async () => {
        const ipfsOptions = await createIpfsOptions(overrideConfig);
        return factory.spawn({
            ipfsOptions,
        });
    }));
    const instances = controllers.map((c) => c.api);
    try {
        await task(instances);
    }
    finally {
        await factory.clean();
    }
}
async function withJsFleet(n, task, overrideConfig = {}) {
    const instances = await Promise.all(Array.from({ length: n }).map(() => createIPFS(overrideConfig)));
    try {
        await task(instances);
    }
    finally {
        instances.map((instance) => instance.stop());
    }
}
//# sourceMappingURL=create-ipfs.js.map