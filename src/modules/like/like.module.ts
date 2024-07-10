import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { Like } from './entities/like.entity';
import { LikeController } from './like.controller';
import { LikeService } from './like.service';
import { Question } from '../question/entities/question.entity';
import { Answer } from '../answer/entities/answer.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Like, Question, Answer]), AuthModule], 
  providers: [
    LikeService,
  ],
  controllers: [LikeController],
  exports: [LikeService],
})
export class LikeModule {}
