import S3 from 'aws-sdk/clients/s3';
import IPFSRepo from 'ipfs-repo';
import S3Store from 'datastore-s3';

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

/**
 * A convenience method for creating an S3 backed IPFS repo
 *
 * @param {Object} S3Store
 * @param {Object} options
 * @param {Object} s3Options
 * @returns {Object}
 */
export function createRepo(options: any, s3Options: any): any {
  const { bucket, region, accessKeyId, secretAccessKey } = s3Options;

  const { path, createIfMissing, lock } = options;

  const storeConfig = {
    s3: new S3({
      params: {
        Bucket: bucket,
      },
      region,
      accessKeyId,
      secretAccessKey,
    }),
    createIfMissing,
  };

  // If no lock is given, create a mock lock
  const effectiveLock = lock || notALock;

  return new IPFSRepo(path, {
    storageBackends: {
      root: S3Store,
      blocks: S3Store,
      keys: S3Store,
      datastore: S3Store,
      pins: S3Store,
    },
    storageBackendOptions: {
      root: {
        ...storeConfig,
      },
      blocks: {
        ...storeConfig,
        sharding: true,
      },
      keys: {
        ...storeConfig,
      },
      datastore: {
        ...storeConfig,
      },
      pins: {
        ...storeConfig,
      },
    },
    lock: effectiveLock,
  });
}
