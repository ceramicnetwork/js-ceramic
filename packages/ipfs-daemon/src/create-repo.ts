import S3 from 'aws-sdk/clients/s3';
import IPFSRepo from 'ipfs-repo';
import DatastoreLevel from 'datastore-level';
import DatastoreFS from 'datastore-fs';
import DatastoreS3 from 'datastore-s3';
import path from 'path';

// A mock lock
const notALock = {
  getLockfilePath: () => {
    // Do Nothing
  },
  lock: () => notALock.getCloser(),
  getCloser: () => ({
    close: () => {
      // Do Nothing
    },
  }),
  locked: () => false,
};

export enum StorageBackend {
  DEFAULT,
  S3,
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace StorageBackend {
  // eslint-disable-next-line no-inner-declarations
  export function fromEnv(input: string | undefined) {
    switch (String(input).toLowerCase()) {
      case 'default':
        return StorageBackend.DEFAULT;
      case 's3':
        return StorageBackend.S3;
      default:
        return StorageBackend.DEFAULT;
    }
  }
}

type RepoOptions = {
  path: string;
  localPathPrefix: string | undefined;
  createIfMissing: boolean;
  backends: Record<string, StorageBackend>;
};

type S3Options = {
  bucket?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
};

class NoBackendConfigError extends Error {
  constructor(backend: never) {
    super(`Expect config for ${backend} config`);
  }
}

function localPath(prefix: string | undefined, location: string) {
  if (prefix) {
    return path.resolve(prefix, location.replace(/^\//, ''));
  } else {
    return location;
  }
}

function LocalDatastoreFS(pathPrefix: string | undefined) {
  return class LocalDatastoreFS extends DatastoreFS {
    constructor(repoPath: string, options: any) {
      super(localPath(pathPrefix, repoPath), options);
    }
  };
}

function LocalDatastoreLevel(pathPrefix: string | undefined) {
  return class LocalDatastoreLevel extends DatastoreLevel {
    constructor(repoPath: string, options: any) {
      super(localPath(pathPrefix, repoPath), options);
    }
  };
}

/**
 * Add repository backend to IPFS configuration.
 */
function setRepoBackend(config: any, name: string, repoOptions: RepoOptions, s3: () => S3, defaultBackend: any) {
  const backend = repoOptions.backends[name] as StorageBackend;
  switch (backend) {
    case StorageBackend.DEFAULT:
      config.storageBackendOptions ||= {};
      config.storageBackendOptions[name] = {
        createIfMissing: repoOptions.createIfMissing,
      };
      config.storageBackends ||= {};
      config.storageBackends[name] = defaultBackend(repoOptions.localPathPrefix);
      return;
    case StorageBackend.S3:
      if (!s3) throw new Error(`Expect s3 configuration for backend ${name}`);
      config.storageBackendOptions ||= {};
      config.storageBackendOptions[name] = {
        s3: s3(),
        createIfMissing: repoOptions.createIfMissing,
      };
      config.storageBackends ||= {};
      config.storageBackends[name] = DatastoreS3;
      return;
    default:
      throw new NoBackendConfigError(backend);
  }
}
/**
 * A convenience method for creating an S3 backed IPFS repo
 */
export function createRepo(options: RepoOptions, s3Options: S3Options): IPFSRepo {
  let _s3: S3 | undefined = undefined;
  function s3() {
    const { bucket, region, accessKeyId, secretAccessKey } = s3Options;
    if (!(bucket && accessKeyId && secretAccessKey)) throw new Error(`Expect AWS credentials`);
    if (!_s3) {
      _s3 = new S3({
        params: {
          Bucket: bucket,
        },
        region,
        accessKeyId,
        secretAccessKey,
      });
    }
    return _s3;
  }

  const config = {
    lock: notALock,
  };
  setRepoBackend(config, 'root', options, s3, LocalDatastoreFS);
  setRepoBackend(config, 'blocks', options, s3, LocalDatastoreFS);
  setRepoBackend(config, 'keys', options, s3, LocalDatastoreFS);
  setRepoBackend(config, 'datastore', options, s3, LocalDatastoreLevel);
  setRepoBackend(config, 'pins', options, s3, LocalDatastoreLevel);

  return new IPFSRepo(options.path, config);
}
