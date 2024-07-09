import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { Like } from './entities/like.entity';
import { LikeController } from './like.controller';
import { LikeService } from './like.service';

@Module({
  imports: [MikroOrmModule.forFeature([Like]), AuthModule], 
  providers: [
    LikeService,
  ],
  controllers: [LikeController],
  exports: [LikeService],
})
export class LikeModule {}
