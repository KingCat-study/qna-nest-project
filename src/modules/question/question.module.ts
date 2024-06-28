import { Module } from '@nestjs/common';
import { QuestionService } from './question.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Question } from './entities/question.entity';
import { QuestionController } from './question.controller';

@Module({
  imports: [MikroOrmModule.forFeature([Question])],
  providers: [QuestionService],
  controllers: [QuestionController],
})
export class QuestionModule { }
