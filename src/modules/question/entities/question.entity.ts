import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { User } from '../../user/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';
import { TimestampsEntity } from '../../../common/entities/timestamps.entity';

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
}