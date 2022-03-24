import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm'

import { Controller } from './controller.js'
import { Tag } from './tag.js'

@Entity()
export class Stream {
  // Stream IDs

  @PrimaryColumn()
  id: string

  @Column()
  tip: string

  // Stream metadata

  @Column()
  @Index()
  isDeterministic: boolean

  @Column({ nullable: true })
  @Index()
  family?: string

  @Column({ nullable: true })
  @Index()
  schema?: string

  @ManyToMany(() => Controller, (controller) => controller.streams)
  @JoinTable({
    name: 'stream_controllers',
    joinColumn: { name: 'id' },
    inverseJoinColumn: { name: 'controller' },
  })
  controllers: Array<Controller>

  @ManyToMany(() => Tag, (tag) => tag.streams)
  @JoinTable({
    name: 'stream_tags',
    joinColumn: { name: 'id' },
    inverseJoinColumn: { name: 'tag' },
  })
  tags: Array<Tag>

  @Column({ name: 'tags' })
  inlineTags: string

  // Internal metadata

  @CreateDateColumn()
  firstSeenAt: Date

  @UpdateDateColumn()
  lastChangedAt: Date

  @DeleteDateColumn()
  removalRequestedAt?: Date
}
