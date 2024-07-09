import { Cascade, Collection, Entity, ManyToOne, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';

import { v4 as uuidv4 } from 'uuid';
import { TimestampsEntity } from '../../../common/entities/timestamps.entity';
import { Answer } from '../../answer/entities/answer.entity';
import { Like } from '../../like/entities/like.entity';
import { User } from '../../user/entities/user.entity';

@Entity()
export class Question extends TimestampsEntity {
  @PrimaryKey()
  id: string = uuidv4();

  @Property()
  title: string;

  @Property()
  content: string;

  @ManyToOne()
  author: User;

  @OneToMany(() => Answer, answer => answer.question, { cascade: [Cascade.ALL], orphanRemoval: true })
  answers = new Collection<Answer>(this);

  @OneToMany(() => Like, like => like.question, { cascade: [Cascade.ALL], orphanRemoval: true })
  likes = new Collection<Like>(this);
}