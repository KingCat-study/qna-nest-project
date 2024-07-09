import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ExtendedEntityRepository } from '../../common/repositories/extended-entity-repository';
import { LikeService } from '../like/like.service';
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
        private readonly questionRepository: ExtendedEntityRepository<Question>,
        private readonly likeService: LikeService,
    ) { }

    async createQuestion(createQuestionDto: CreateQuestionDto, author: User): Promise<QuestionResponseDto> {
        const question = this.questionRepository.create({ ...createQuestionDto, author });
        await this.questionRepository.persistAndFlush(question);
        return toQuestionResponseDto(question, false);
    }

    async updateQuestion(updateQuestionDto: UpdateQuestionDto, user: User): Promise<QuestionResponseDto> {
        const question = await this.questionRepository.findOne(updateQuestionDto.id, { populate: ['author'] });
        if (!question) {
            throw new NotFoundException('Question not found');
        }

        this.checkPermissions(question, user, 'update');

        question.title = updateQuestionDto.title;
        question.content = updateQuestionDto.content;
        await this.questionRepository.persistAndFlush(question);

        let isLiked = false;
        if (question.author.id !== user.id) {
            isLiked = await this.likeService.isQuestionLikedByUser(question.id, user);
        }

        return toQuestionResponseDto(question, isLiked);
    }

    async deleteQuestion(id: string, user: User): Promise<void> {
        const question = await this.questionRepository.findOneOrFail(id, { populate: ['author'] });
        this.checkPermissions(question, user, 'delete');
        await this.questionRepository.removeAndFlush(question);
    }

    async findAllQuestions(user?: User): Promise<QuestionResponseDto[]> {
        const questions = await this.questionRepository.findAll();
        return Promise.all(questions.map(async (question) => {
            const isLiked = user ? await this.likeService.isQuestionLikedByUser(question.id, user) : false;
            return toQuestionResponseDto(question, isLiked);
        }));
    }

    async findOneQuestion(id: string, user?: User): Promise<QuestionResponseDto> {
        const question = await this.questionRepository.findOneOrFail(id);
        const isLiked = user ? await this.likeService.isQuestionLikedByUser(question.id, user) : false;
        return toQuestionResponseDto(question, isLiked);
    }

    private checkPermissions(question: Question, user: User, action: string): void {
        if (question.author.id !== user.id && user.role !== UserRole.ADMIN) {
            throw new UnauthorizedException(`You do not have permission to ${action} this question`);
        }
    }
}