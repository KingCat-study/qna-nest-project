import { Module } from '@nestjs/common';
import { LikeService } from './like.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Like } from './entities/like.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Like])],
  providers: [LikeService],
  exports: [LikeService],
})
export class LikeModule {}
