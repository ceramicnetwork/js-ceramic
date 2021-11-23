import S3 from 'aws-sdk/clients/s3'
import { createRepo as createIPFSRepo, IPFSRepo, Backends, Datastore } from 'ipfs-repo'
import { LevelDatastore } from 'datastore-level'
import { FsDatastore } from 'datastore-fs'
import { S3Datastore } from 'datastore-s3'
import path from 'path'
import * as dagCBOR from '@ipld/dag-cbor'
import { BlockstoreDatastoreAdapter } from 'blockstore-datastore-adapter'

const codecLookup = {
  [dagCBOR.code]: dagCBOR,
  [dagCBOR.name]: dagCBOR,
}

// A mock lock
const notALock = {
  getLockfilePath: () => {
    // Do Nothing
  },
  lock: () => Promise.resolve(notALock.getCloser()),
  getCloser: () => ({
    close: () => {
      // Do Nothing
      return Promise.resolve()
    },
  }),
  locked: () => Promise.resolve(false),
}

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
        return StorageBackend.DEFAULT
      case 's3':
        return StorageBackend.S3
      default:
        return StorageBackend.DEFAULT
    }
  }
}

type RepoOptions = {
  path: string
  localPathPrefix: string | undefined
  createIfMissing: boolean
  backends: Record<string, StorageBackend>
}

type S3Options = {
  bucket?: string
  region?: string
  accessKeyId?: string
  secretAccessKey?: string
}

class NoBackendConfigError extends Error {
  constructor(backend: never) {
    super(`Expect config for ${backend} config`)
  }
}

function localPath(prefix: string | undefined, location: string) {
  if (prefix) {
    return path.resolve(prefix, location.replace(/^\//, ''))
  } else {
    return location
  }
}

function createLocalDatastoreFS(
  pathPrefix: string | undefined,
  repoPath: string,
  options: any
): FsDatastore {
  return new FsDatastore(localPath(pathPrefix, repoPath), options)
}

function createLocalDatastoreLevel(
  pathPrefix: string | undefined,
  repoPath: string,
  options: any
): LevelDatastore {
  return new LevelDatastore(localPath(pathPrefix, repoPath), options)
}

function createBackend(
  name: string,
  repoOptions: RepoOptions,
  createS3: () => S3,
  createDefault: (pathPrefix, repoPath, options) => Datastore
): Datastore {
  const backend = repoOptions.backends[name] as StorageBackend
  const repoPath = path.join(repoOptions.path, name === 'root' ? '' : 'datastore')

  switch (backend) {
    case StorageBackend.DEFAULT: {
      const options = { createIfMissing: repoOptions.createIfMissing }
      return createDefault(repoOptions.localPathPrefix, repoPath, options)
    }
    case StorageBackend.S3: {
      if (!createS3) throw new Error(`Expect s3 configuration for backend ${name}`)
      const options = {
        s3: createS3(),
        createIfMissing: repoOptions.createIfMissing,
      }
      return new S3Datastore(repoPath, options)
    }
    default:
      throw new NoBackendConfigError(backend)
  }
}

function createBackends(repoOptions: RepoOptions, createS3: () => S3): Backends {
  return {
    root: createBackend('root', repoOptions, createS3, createLocalDatastoreFS),
    blocks: new BlockstoreDatastoreAdapter(
      createBackend('blocks', repoOptions, createS3, createLocalDatastoreFS)
    ),
    keys: createBackend('keys', repoOptions, createS3, createLocalDatastoreFS),
    datastore: createBackend('datastore', repoOptions, createS3, createLocalDatastoreLevel),
    pins: createBackend('pins', repoOptions, createS3, createLocalDatastoreLevel),
  }
}

/**
 * A convenience method for creating an S3 backed IPFS repo
 */
export function createRepo(options: RepoOptions, s3Options: S3Options): IPFSRepo {
  let _s3: S3 | undefined = undefined
  function s3() {
    const { bucket, region, accessKeyId, secretAccessKey } = s3Options
    if (!(bucket && accessKeyId && secretAccessKey)) throw new Error(`Expect AWS credentials`)
    if (!_s3) {
      _s3 = new S3({
        params: {
          Bucket: bucket,
        },
        region,
        accessKeyId,
        secretAccessKey,
      })
    }
    return _s3
  }

  return createIPFSRepo(
    options.path,
    (codeOrName) => {
      if (codecLookup[codeOrName] == null) {
        return Promise.reject(new Error(`No codec found for "${codeOrName}"`))
      }

      return Promise.resolve(codecLookup[codeOrName])
    },
    createBackends(options, s3)
  )
}
