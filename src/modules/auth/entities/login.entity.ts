import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../user/entities/user.entity';

@Entity()
export class Login {
  
  @PrimaryKey()
  id: string = uuidv4();

  @Property()
  token: string;

  @ManyToOne()
  user: User;

  @Property()
  createdAt: Date = new Date();
}