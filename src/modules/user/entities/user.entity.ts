import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
import { TimestampsEntity } from '../../../common/entities/timestamps.entity'; // Assuming the correct relative path is '../common/entities/timestamps.entity'
import { UserRole } from './user-role.enum';

@Entity()
export class User extends TimestampsEntity {
  
  @PrimaryKey()
  id: string = uuidv4();

  @Property()
  name: string;

  @Property({ unique: true})
  email: string;

  @Property()
  password: string;

  @Property({ type: 'string', default: UserRole.USER })
  role: UserRole = UserRole.USER;
}