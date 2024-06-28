import { Cascade, Collection, Entity, ManyToOne, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
import { TimestampsEntity } from '../../../common/entities/timestamps.entity';
import { Like } from '../../like/entities/like.entity';
import { Question } from '../../question/entities/question.entity';
import { User } from '../../user/entities/user.entity';

@Entity()
export class Answer extends TimestampsEntity {
    @PrimaryKey()
    id: string = uuidv4();

    @Property()
    content: string;
  
    @ManyToOne()
    author: User;
  
    @ManyToOne()
    question: Question;
  
    @OneToMany(() => Like, like => like.answer, { cascade: [Cascade.ALL], orphanRemoval: true })
    likes = new Collection<Like>(this);
}