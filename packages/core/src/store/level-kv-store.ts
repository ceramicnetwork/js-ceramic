import type { IKVStoreA } from './ikv-store.js'
import type { Level } from 'level'

export class LevelKVStore implements IKVStoreA {
  constructor(level: Level) {}
}
