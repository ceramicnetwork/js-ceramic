import DatastoreLevel from 'datastore-level';
import DatastoreFS from 'datastore-fs';
import DatastoreS3 from 'datastore-s3';
import path from 'path';

function LocalDatastoreLevel(localPath: string) {
  return class LocalDatastoreLevel extends DatastoreLevel {
    constructor(repoPath: string, options: any) {
      super(path.resolve(localPath, repoPath.replace(/^\//, '')), options);
    }
  };
}

function LocalDatastoreFS(localPath: string) {
  return class LocalDatastoreFS extends DatastoreFS {
    constructor(repoPath: string, options: any) {
      super(path.resolve(localPath, repoPath.replace(/^\//, '')), options);
    }
  };
}

export function makeStorageBackends(localPrefix?: string): any {
  if (localPrefix) {
    return {
      root: LocalDatastoreFS(localPrefix),
      blocks: DatastoreS3,
      keys: LocalDatastoreFS(localPrefix),
      datastore: LocalDatastoreLevel(localPrefix),
      pins: LocalDatastoreLevel(localPrefix),
    };
  } else {
    return {
      root: DatastoreS3,
      blocks: DatastoreS3,
      keys: DatastoreS3,
      datastore: DatastoreS3,
      pins: DatastoreS3,
    };
  }
}
