import { Module } from '@nestjs/common';
import { QuestionService } from './question.service';
import { QuestionController } from './question.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Question } from './entities/question.entity';
import { LikeModule } from '../like/like.module'; 

@Module({
  imports: [
    MikroOrmModule.forFeature([Question]),
    LikeModule, 
  ],
  providers: [QuestionService],
  controllers: [QuestionController],
  exports: [QuestionService],
})
export class QuestionModule { }
