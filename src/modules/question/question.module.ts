import { Module } from '@nestjs/common';
import { QuestionService } from './question.service';
import { QuestionController } from './question.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Question } from './entities/question.entity';
import { LikeModule } from '../like/like.module'; 
import { LikeService } from '../like/like.service';
import { ExtendedEntityRepository } from 'src/common/repositories/extended-entity-repository';

@Module({
  imports: [
    MikroOrmModule.forFeature([Question]),
  ],
  providers: [
    QuestionService,
    LikeService,
    { provide: 'entityRepository', useClass: ExtendedEntityRepository },
  ],
  controllers: [QuestionController],
  exports: [QuestionService],
})
export class QuestionModule { }
