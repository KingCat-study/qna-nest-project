import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { Question } from './entities/question.entity';
import { User } from '../user/entities/user.entity';
import { CreateQuestionDto } from './dtos/create-question.dto';
import { UpdateQuestionDto } from './dtos/update-question.dto';
import { QuestionResponseDto } from './dtos/question-response.dto';
import { toQuestionResponseDto } from './dtos/dto.mapper';
import { UserRole } from '../user/entities/user-role.enum';
import { LikeService } from '../like/like.service';

@Injectable()
export class QuestionService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: EntityRepository<Question>,
    private readonly em: EntityManager,
    private readonly likeService: LikeService,
  ) {}

  async createQuestion(createQuestionDto: CreateQuestionDto, author: User): Promise<QuestionResponseDto> {
    const question = this.questionRepository.create({ ...createQuestionDto, author });
    await this.em.persistAndFlush(question);
    return toQuestionResponseDto(question, false);
  }

  async updateQuestion(updateQuestionDto: UpdateQuestionDto, user: User): Promise<QuestionResponseDto> {
    const question = await this.questionRepository.findOneOrFail(updateQuestionDto.id, { populate: ['author'] });
    this.checkPermissions(question, user, 'update');

    question.title = updateQuestionDto.title;
    question.content = updateQuestionDto.content;
    await this.em.persistAndFlush(question);

    let isLiked = false;
    if (question.author.id !== user.id) {
      isLiked = await this.likeService.isQuestionLikedByUser(question.id, user);
    }

    return toQuestionResponseDto(question, isLiked);
  }

  async deleteQuestion(id: string, user: User): Promise<void> {
    const question = await this.questionRepository.findOneOrFail(id, { populate: ['author'] });
    this.checkPermissions(question, user, 'delete');
    await this.em.removeAndFlush(question);
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
      throw new ForbiddenException(`You do not have permission to ${action} this question`);
    }
  }
}