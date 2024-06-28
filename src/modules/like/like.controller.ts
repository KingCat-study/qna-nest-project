import { Controller, Patch, Param, UseGuards } from '@nestjs/common';
import { LikeService } from './like.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../user/entities/user.entity';
import { LikeResponseDto } from './dtos/like-response.dto';

@Controller('like')
@UseGuards(AuthGuard)
export class LikeController {
    constructor(private readonly likeService: LikeService) { }

    @Patch('question/:id')
    async toggleLikeQuestion(@Param('id') questionId: string, @GetUser() user: User): Promise<LikeResponseDto> {
        return this.likeService.toggleLikeQuestion(questionId, user);
    }

    @Patch('answer/:id')
    async toggleLikeAnswer(@Param('id') answerId: string, @GetUser() user: User): Promise<LikeResponseDto> {
        return this.likeService.toggleLikeAnswer(answerId, user);
    }
}