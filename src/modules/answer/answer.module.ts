import { Module } from '@nestjs/common';
import { AnswerService } from './answer.service';
import { AnswerController } from './answer.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Answer } from './entities/answer.entity';
import { LikeModule } from '../like/like.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([Answer]),
    LikeModule,
  ],
  providers: [AnswerService],
  controllers: [AnswerController],
  exports: [AnswerService],
})
export class AnswerModule {}
