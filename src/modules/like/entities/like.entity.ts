import { Entity, PrimaryKey, ManyToOne, Property } from '@mikro-orm/core';
import { User } from '../../user/entities/user.entity';
import { Question } from '../../question/entities/question.entity';
import { Answer } from '../../answer/entities/answer.entity';

@Entity()
export class Like {
  @PrimaryKey()
  id: string;

  @ManyToOne({ entity: () => User })
  user: User;

  @ManyToOne({ entity: () => Question, nullable: true })
  question?: Question;

  @ManyToOne({ entity: () => Answer, nullable: true })
  answer?: Answer;

  @Property()
  createdAt: Date = new Date();
}