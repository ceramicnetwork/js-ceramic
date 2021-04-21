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

export function makeStorageBackends(localIpfs?: string): any {
  if (localIpfs) {
    return {
      root: LocalDatastoreFS(localIpfs),
      blocks: DatastoreS3,
      keys: LocalDatastoreFS(localIpfs),
      datastore: LocalDatastoreLevel(localIpfs),
      pins: LocalDatastoreLevel(localIpfs),
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
