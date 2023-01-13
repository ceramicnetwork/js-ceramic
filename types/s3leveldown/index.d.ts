import { AbstractIterator, AbstractIteratorOptions, ErrorValueCallback } from 'abstract-leveldown'

declare module 's3leveldown' {
  /*
  Need to foll ts into thinking that S3LevelDOWN implements these, because otherwise it shows errors
  when doing new LevelUp(s3LevelDown).
   */
  interface S3LevelDOWN {
    /*
    status, isOperational and getMany are not implemented in S3LevelDown, but we also don't need to use them
     */
    readonly status: 'new' | 'opening' | 'open' | 'closing' | 'closed'
    isOperational(): boolean
    getMany(key: Array<string>, cb: ErrorValueCallback<Array<string>>): void

    /*
    iterator is not compatible in S3LevelDown only because it has the db: AbstractLevelDOWN<K, V>;
    param and S3LevelDown is not compatible with AbstractLevelDOWN<K, V>
     */
    iterator(options?: AbstractIteratorOptions<string>): AbstractIterator<string, string>
  }
}
