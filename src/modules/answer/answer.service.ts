import { InjectRepository } from '@mikro-orm/nestjs';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ExtendedEntityRepository } from '../../common/repositories/extended-entity-repository';
import { LikeService } from '../like/like.service';
import { Question } from '../question/entities/question.entity';
import { UserRole } from '../user/entities/user-role.enum';
import { User } from '../user/entities/user.entity';
import { AnswerResponseDto } from './dtos/answer-response.dto';
import { CreateAnswerDto } from './dtos/create-answer.dto';
import { toAnswerResponseDto } from './dtos/dto.mapper';
import { UpdateAnswerDto } from './dtos/update-answer.dto';
import { Answer } from './entities/answer.entity';

@Injectable()
export class AnswerService {
    constructor(
        @InjectRepository(Answer)
        private readonly answerRepository: ExtendedEntityRepository<Answer>,

        @InjectRepository(Question)
        private readonly questionRepository: ExtendedEntityRepository<Question>,

        private readonly likeService: LikeService,
    ) { }

    async createAnswer(createAnswerDto: CreateAnswerDto, author: User): Promise<AnswerResponseDto> {
        const question = await this.questionRepository.findOne(createAnswerDto.questionId);
        if (!question) {
            throw new NotFoundException('Question not found');
        }

        const answer = this.answerRepository.create({ content: createAnswerDto.content, author, question });
        await this.answerRepository.persistAndFlush(answer);
        return toAnswerResponseDto(answer, false);
    }

    async updateAnswer(updateAnswerDto: UpdateAnswerDto, user: User): Promise<AnswerResponseDto> {
        const answer = await this.answerRepository.findOne(updateAnswerDto.id);
        if (!answer) {
            throw new NotFoundException('Answer not found');
        }
        this.checkPermissions(answer, user, 'update');

        answer.content = updateAnswerDto.content;
        await this.answerRepository.persistAndFlush(answer);

        let isLiked = false;
        if (answer.author.id !== user.id) {
            isLiked = await this.likeService.isAnswerLikedByUser(answer.id, user);
        }

        return toAnswerResponseDto(answer, isLiked);
    }

    async deleteAnswer(id: string, user: User): Promise<void> {
        const answer = await this.answerRepository.findOne(id);
        if (!answer) {
            throw new NotFoundException('Answer not found');
        }
        this.checkPermissions(answer, user, 'delete');
        await this.answerRepository.removeAndFlush(answer);
    }

    async findAllAnswersByQuestion(questionId: string, user?: User): Promise<AnswerResponseDto[]> {
        const answers = await this.answerRepository.find({ question: { id: questionId } });
        return Promise.all(answers.map(async (answer) => {
            const isLiked = user ? await this.likeService.isAnswerLikedByUser(answer.id, user) : false;
            return toAnswerResponseDto(answer, isLiked);
        }));
    }

    private checkPermissions(answer: Answer, user: User, action: string): void {
        if (answer.author.id !== user.id && user.role !== UserRole.ADMIN) {
            throw new ForbiddenException(`You do not have permission to ${action} this answer`);
        }
    }
}