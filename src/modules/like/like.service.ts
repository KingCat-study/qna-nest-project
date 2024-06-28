import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { Like } from './entities/like.entity';
import { User } from '../user/entities/user.entity';
import { Question } from '../question/entities/question.entity';
import { Answer } from '../answer/entities/answer.entity';
import { LikeResponseDto } from './dtos/like-response.dto';

@Injectable()
export class LikeService {
    constructor(
        @InjectRepository(Like)
        private readonly likeRepository: EntityRepository<Like>,
        private readonly em: EntityManager,
    ) { }

    async isQuestionLikedByUser(questionId: string, user: User): Promise<boolean> {
        const like = await this.likeRepository.findOne({ question: { id: questionId }, user });
        return !!like;
    }

    async isAnswerLikedByUser(answerId: string, user: User): Promise<boolean> {
        const like = await this.likeRepository.findOne({ answer: { id: answerId }, user });
        return !!like;
    }

    async toggleLikeQuestion(questionId: string, user: User): Promise<LikeResponseDto> {
        const question = await this.em.findOneOrFail(Question, questionId);
        const liked = await this.toggleLike(question, user);
        return this.createLikeResponseDto('Question', liked);
    }

    async toggleLikeAnswer(answerId: string, user: User): Promise<LikeResponseDto> {
        const answer = await this.em.findOneOrFail(Answer, answerId);
        const liked = await this.toggleLike(answer, user);
        return this.createLikeResponseDto('Answer', liked);
    }

    async toggleLike(target: Question | Answer, user: User): Promise<boolean> {
        const like = await this.findLike(target, user);

        if (like) {
            await this.em.removeAndFlush(like);
            return false;
        } else {
            this.checkSelfLike(target, user);
            const newLike = this.createLike(target, user);
            await this.em.persistAndFlush(newLike);
            return true;
        }
    }

    async findLike(target: Question | Answer, user: User): Promise<Like | null> {
        if (target instanceof Question) {
            return this.likeRepository.findOne({ question: target, user });
        } else { // 이 경우 target은 Answer 타입임이 보장됩니다.
            return this.likeRepository.findOne({ answer: target, user });
        }
    }

    createLike(target: Question | Answer, user: User): Like {
        if (target instanceof Question) {
            return this.likeRepository.create({ user, question: target });
        } else {
            return this.likeRepository.create({ user, answer: target });
        }
    }

    checkSelfLike(target: Question | Answer, user: User): void {
        if (target.author.id === user.id) {
            const targetType = target instanceof Question ? 'question' : 'answer';
            throw new BadRequestException(`You cannot like your own ${targetType}.`);
        }
    }

    createLikeResponseDto(type: 'Question' | 'Answer', liked: boolean): LikeResponseDto {
        return { message: `${type} like status toggled`, liked };
    }
}