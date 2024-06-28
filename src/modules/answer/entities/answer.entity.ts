import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../user/entities/user.entity';
import { Question } from '../../question/entities/question.entity';
import { TimestampsEntity } from '../../../common/entities/timestamps.entity';

@Entity()
export class Answer extends TimestampsEntity {
    @PrimaryKey()
    id: string = uuidv4();

    @Property()
    content: string;

    @ManyToOne(() => User)
    author: User;

    @ManyToOne(() => Question)
    question: Question;
}