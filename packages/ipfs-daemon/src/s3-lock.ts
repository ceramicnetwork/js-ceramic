import path from 'path';
import S3Store from 'datastore-s3';

/**
 * Uses an object in an S3 bucket as a lock to signal that an IPFS repo is in use.
 * When the object exists, the repo is in use. You would normally use this to make
 * sure multiple IPFS nodes don’t use the same S3 bucket as a datastore at the same time.
 */
export class S3Lock {
  readonly s3: S3Store;
  constructor(s3Datastore: S3Store) {
    this.s3 = s3Datastore;
  }

  /**
   * Returns the location of the lock file given the path it should be located at
   *
   * @private
   * @param {string} dir
   * @returns {string}
   */
  getLockfilePath(dir): string {
    return path.join(dir, 'repo.lock');
  }

  /**
   * Creates the lock. This can be overriden to customize where the lock should be created
   *
   * @param {string} dir
   * @returns {Promise<LockCloser>}
   */
  async lock(dir): Promise<{ close: () => Promise<void> }> {
    const lockPath = this.getLockfilePath(dir);

    let alreadyLocked, err;
    try {
      alreadyLocked = await this.locked(dir);
    } catch (e) {
      err = e;
    }
    if (err || alreadyLocked) {
      throw new Error('The repo is already locked');
    }

    // There's no lock yet, create one
    const data = await this.s3.put(lockPath, Buffer.from('')).promise();
    return this.getCloser(lockPath);
  }

  /**
   * Returns a LockCloser, which has a `close` method for removing the lock located at `lockPath`
   *
   * @param {string} lockPath
   * @returns {LockCloser}
   */
  getCloser(lockPath): {close: () => Promise<void>} {
    const closer = {
      /**
       * Removes the lock. This can be overriden to customize how the lock is removed. This
       * is important for removing any created locks.
       *
       * @returns {Promise}
       */
      close: async () => {
        try {
          await this.s3.delete(lockPath).promise();
        } catch (err) {
          if (err.statusCode !== 404) {
            throw err;
          }
        }
      },
    };

    const cleanup = async (err) => {
      if (err instanceof Error) {
        console.log('\nAn Uncaught Exception Occurred:\n', err);
      } else if (err) {
        console.log('\nReceived a shutdown signal:', err);
      }

      console.log('\nAttempting to cleanup gracefully...');

      try {
        await closer.close();
      } catch (e) {
        console.log('Caught error cleaning up: %s', e.message);
      }
      console.log('Cleanup complete, exiting.');
      process.exit();
    };

    // listen for graceful termination
    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);
    process.on('SIGHUP', cleanup);
    process.on('uncaughtException', cleanup);

    return closer;
  }

  /**
   * Calls back on whether or not a lock exists. Override this method to customize how the check is made.
   *
   * @param {string} dir
   * @returns {Promise<boolean>}
   */
  async locked(dir): Promise<boolean> {
    try {
      await this.s3.get(this.getLockfilePath(dir)).promise();
    } catch (err) {
      if (err.code === 'ERR_NOT_FOUND') {
        return false;
      }
      throw err;
    }

    return true;
  }
}
