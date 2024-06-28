import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '../user/entities/user-role.enum';
import { User } from '../user/entities/user.entity';
import { CreateQuestionDto } from './dtos/create-question.dto';
import { toQuestionResponseDto } from './dtos/dto.mapper';
import { QuestionResponseDto } from './dtos/question-response.dto';
import { UpdateQuestionDto } from './dtos/update-question.dto';
import { Question } from './entities/question.entity';

@Injectable()
export class QuestionService {
    constructor(
        @InjectRepository(Question)
        private readonly questionRepository: EntityRepository<Question>,
        private readonly em: EntityManager,
    ) { }

    private checkPermissions(question: Question, user: User, action: string): void {
        if (question.author.id !== user.id && user.role !== UserRole.ADMIN) {
            throw new ForbiddenException(`You do not have permission to ${action} this question`);
        }
    }

    async createQuestion(createQuestionDto: CreateQuestionDto, author: User): Promise<QuestionResponseDto> {
        const question = this.questionRepository.create({
            ...createQuestionDto,
            author,
        });
        await this.em.persistAndFlush(question);
        return toQuestionResponseDto(question);
    }

    async updateQuestion(updateQuestionDto: UpdateQuestionDto, user: User): Promise<QuestionResponseDto> {
        const question = await this.questionRepository.findOneOrFail(updateQuestionDto.id);

        this.checkPermissions(question, user, 'update');

        question.title = updateQuestionDto.title || question.title;
        question.content = updateQuestionDto.content || question.content;

        await this.em.persistAndFlush(question);
        return toQuestionResponseDto(question);
    }

    async deleteQuestion(id: string, user: User): Promise<void> {
        const question = await this.questionRepository.findOneOrFail(id);

        this.checkPermissions(question, user, 'delete');

        await this.em.removeAndFlush(question);
    }

    async findAll(): Promise<QuestionResponseDto[]> {
        const questions = await this.questionRepository.findAll();
        return questions.map(toQuestionResponseDto);
    }

    async findOne(id: string): Promise<QuestionResponseDto> {
        const question = await this.questionRepository.findOneOrFail(id);
        return toQuestionResponseDto(question);
    }
}