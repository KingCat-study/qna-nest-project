import { InjectRepository } from '@mikro-orm/nestjs';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ExtendedEntityRepository } from '../../common/repositories/extended-entity-repository';
import { Answer } from '../answer/entities/answer.entity';
import { Question } from '../question/entities/question.entity';
import { User } from '../user/entities/user.entity';
import { LikeResponseDto } from './dtos/like-response.dto';
import { Like } from './entities/like.entity';

@Injectable()
export class LikeService {
    constructor(
        @InjectRepository(Like)
        private readonly likeRepository: ExtendedEntityRepository<Like>,

        @InjectRepository(Question)
        private readonly questionRepository: ExtendedEntityRepository<Question>,

        @InjectRepository(Answer)
        private readonly answerRepository: ExtendedEntityRepository<Answer>,
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
        try {
            const question = await this.questionRepository.findOne({ id: questionId });
            if (!question) {
                throw new NotFoundException('Question not found');
            }

            const liked = await this.toggleLike(question, user);
            return this.createLikeResponseDto('Question', liked);
        } catch (error) {
            throw new NotFoundException('Question not found');
        }
    }

    async toggleLikeAnswer(answerId: string, user: User): Promise<LikeResponseDto> {
        const answer = await this.answerRepository.findOne({ id: answerId });
        if (!answer) {
            throw new NotFoundException('Answer not found');
        }

        const liked = await this.toggleLike(answer, user);
        return this.createLikeResponseDto('Answer', liked);
    }

    async toggleLike(target: Question | Answer, user: User): Promise<boolean> {
        const like = await this.findLike(target, user);
    
        if (like) {
            await this.likeRepository.removeAndFlush(like);
            return false;
        } else {
            this.checkSelfLike(target, user);
            const newLike = this.createLike(target, user);
            await this.likeRepository.persistAndFlush(newLike);
            return true;
        }
    }

    async findLike(target: Question | Answer, user: User): Promise<Like | null> {
        if (target instanceof Question) {
            return this.likeRepository.findOne({ question: target, user });
        } else { 
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