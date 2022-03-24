import { Entity, ManyToMany, PrimaryColumn } from 'typeorm'

import { Stream } from './stream.js'

@Entity()
export class Tag {
  @PrimaryColumn()
  value: string

  @ManyToMany(() => Stream, (meta) => meta.tags)
  streams: Array<Stream>
}
