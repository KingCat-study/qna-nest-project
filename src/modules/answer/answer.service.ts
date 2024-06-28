import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { ForbiddenException, Injectable } from '@nestjs/common';
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
        private readonly answerRepository: EntityRepository<Answer>,
        @InjectRepository(Question) 
        private readonly questionRepository: EntityRepository<Question>,
        private readonly em: EntityManager,
    ) { }

    async createAnswer(createAnswerDto: CreateAnswerDto, author: User): Promise<AnswerResponseDto> {
        const question = await this.questionRepository.findOneOrFail(createAnswerDto.questionId);
        const answer = this.answerRepository.create({ content: createAnswerDto.content, author, question });
        await this.em.persistAndFlush(answer);
        return toAnswerResponseDto(answer);
        
    }

    private checkPermissions(answer: Answer, user: User, action: string): void {
        if (answer.author.id !== user.id && user.role !== UserRole.ADMIN) {
            throw new ForbiddenException(`You do not have permission to ${action} this answer`);
        }
    }

    async updateAnswer(updateAnswerDto: UpdateAnswerDto, user: User): Promise<AnswerResponseDto> {
        const answer = await this.answerRepository.findOneOrFail(updateAnswerDto.id, { populate: ['author'] });
        this.checkPermissions(answer, user, 'update');

        answer.content = updateAnswerDto.content;
        await this.em.persistAndFlush(answer);
        return toAnswerResponseDto(answer);
    }

    async deleteAnswer(id: string, user: User): Promise<void> {
        const answer = await this.answerRepository.findOneOrFail(id, { populate: ['author'] });
        this.checkPermissions(answer, user, 'delete');
        await this.em.removeAndFlush(answer);
    }

    async findAllAnswersByQuestion(questionId: string): Promise<AnswerResponseDto[]> {
        const answers = await this.answerRepository.find({ question: { id: questionId } });
        return answers.map(toAnswerResponseDto);
    }
}