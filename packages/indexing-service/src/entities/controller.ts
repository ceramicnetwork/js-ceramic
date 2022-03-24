import { Entity, ManyToMany, PrimaryColumn } from 'typeorm'

import { Stream } from './stream.js'

@Entity()
export class Controller {
  @PrimaryColumn()
  value: string

  @ManyToMany(() => Stream, (meta) => meta.controllers)
  streams: Array<Stream>
}
