import { Collection, EntityManager } from '@mikro-orm/core';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Like } from '../like/entities/like.entity';
import { LikeService } from '../like/like.service';
import { Question } from '../question/entities/question.entity';
import { UserRole } from '../user/entities/user-role.enum';
import { User } from '../user/entities/user.entity';
import { AnswerService } from './answer.service';
import { CreateAnswerDto } from './dtos/create-answer.dto';
import { UpdateAnswerDto } from './dtos/update-answer.dto';
import { Answer } from './entities/answer.entity';

describe('AnswerService', () => {
  let answerService: AnswerService;

  const mockAnswerRepository = {
    create: jest.fn(),
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    find: jest.fn(),
  };

  const mockQuestionRepository = {
    findOneOrFail: jest.fn(),
  };

  const mockLikeService = {
    isAnswerLikedByUser: jest.fn(),
  };

  const mockEntityManager = {
    persistAndFlush: jest.fn(),
    removeAndFlush: jest.fn(),
    findOneOrFail: jest.fn(),
  };

  beforeEach(async () => {

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnswerService,
        { provide: getRepositoryToken(Answer), useValue: mockAnswerRepository },
        { provide: getRepositoryToken(Question), useValue: mockQuestionRepository },
        { provide: LikeService, useValue: mockLikeService },
        { provide: EntityManager, useValue: mockEntityManager },
      ],
    }).compile();

    answerService = module.get<AnswerService>(AnswerService);
  });

  it('should be defined', () => {
    expect(answerService).toBeDefined();
  });

  describe('createAnswer', () => {
    it('should create a new answer', async () => {
      const user: User = { id: '1', name: 'User', email: 'user@example.com', password: 'password', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() };
      const author: User = user;
      const question: Question = {
        id: '1',
        title: 'Test Question',
        content: 'Test Content',
        author: user,
        createdAt: new Date(),
        updatedAt: new Date(),
        answers: new Collection<Answer>(this),
        likes: new Collection<Like>(this),
      };

      const createAnswerDto: CreateAnswerDto = { content: 'Test Answer', questionId: question.id };
      const answer: Answer = {
        id: '1',
        content: 'Test Answer',
        author: user,
        question,
        createdAt: new Date(),
        updatedAt: new Date(),
        likes: new Collection<Like>(this)
      };

      jest.spyOn(mockEntityManager, 'findOneOrFail').mockResolvedValue(question);
      jest.spyOn(mockAnswerRepository, 'create').mockReturnValue(answer);
      jest.spyOn(mockEntityManager, 'persistAndFlush').mockResolvedValue(undefined);
      jest.spyOn(mockLikeService, 'isAnswerLikedByUser').mockResolvedValue(false);

      const result = await answerService.createAnswer(createAnswerDto, user);

      expect(result).toEqual({
        id: answer.id,
        content: answer.content,
        createdAt: answer.createdAt,
        updatedAt: answer.updatedAt,
        authorId: answer.author.id,
        questionId: answer.question.id,
        isLiked: false
      });

      expect(mockEntityManager.findOneOrFail).toHaveBeenCalledWith(Question, createAnswerDto.questionId);
      expect(mockAnswerRepository.create).toHaveBeenCalledWith({ content: createAnswerDto.content, author, question });
      expect(mockEntityManager.persistAndFlush).toHaveBeenCalledWith(answer);
    });
  });

  describe('updateAnswer', () => {
    it('should update an answer', async () => {
      const updateAnswerDto: UpdateAnswerDto = { id: '1', content: 'Updated Answer' };
      const user: User = { id: '1', name: 'User', email: 'user@example.com', password: 'password', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() };
      const answer: Answer = {
        id: '1',
        content: 'Test Answer',
        author: user,
        question: { id: '1' } as Question,
        createdAt: new Date(),
        updatedAt: new Date(),
        likes: new Collection<Like>(this),
      };

      jest.spyOn(mockAnswerRepository, 'findOneOrFail').mockResolvedValue(answer);
      jest.spyOn(mockEntityManager, 'persistAndFlush').mockResolvedValue(undefined);
      jest.spyOn(mockLikeService, 'isAnswerLikedByUser').mockResolvedValue(false);

      const result = await answerService.updateAnswer(updateAnswerDto, user);

      expect(result).toEqual({
        id: answer.id,
        content: updateAnswerDto.content,
        createdAt: answer.createdAt,
        updatedAt: answer.updatedAt,
        authorId: answer.author.id,
        questionId: answer.question.id,
        isLiked: false
      });
      expect(mockEntityManager.persistAndFlush).toHaveBeenCalledWith(answer);
    });

    it('should throw ForbiddenException if user is not the author or admin', async () => {
      const updateAnswerDto: UpdateAnswerDto = { id: '1', content: 'Updated Answer' };
      const user: User = { id: '2', name: 'Other User', email: 'other@example.com', password: 'password', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() };
      const answer: Answer = {
        id: '1',
        content: 'Test Answer',
        author: { ...user, id: '1' },
        question: { id: '1' } as Question,
        createdAt: new Date(),
        updatedAt: new Date(),
        likes: new Collection<Like>(this)
      };

      jest.spyOn(mockAnswerRepository, 'findOneOrFail').mockResolvedValue(answer);

      await expect(answerService.updateAnswer(updateAnswerDto, user)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteAnswer', () => {
    it('should delete an answer', async () => {
      const user: User = { id: '1', name: 'User', email: 'user@example.com', password: 'password', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() };
      const answer: Answer = {
        id: '1',
        content: 'Test Answer',
        author: user,
        question: { id: '1' } as Question,
        createdAt: new Date(),
        updatedAt: new Date(),
        likes: new Collection<Like>(this)
      };

      jest.spyOn(mockAnswerRepository, 'findOneOrFail').mockResolvedValue(answer);
      jest.spyOn(mockEntityManager, 'removeAndFlush').mockResolvedValue(undefined);

      await answerService.deleteAnswer('1', user);

      expect(mockEntityManager.removeAndFlush).toHaveBeenCalledWith(answer);
    });

    it('should throw ForbiddenException if user is not the author or admin', async () => {
      const user: User = { id: '2', name: 'Other User', email: 'other@example.com', password: 'password', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() };
      const answer: Answer = {
        id: '1',
        content: 'Test Answer',
        author: { ...user, id: '1' },
        question: { id: '1' } as Question,
        createdAt: new Date(),
        updatedAt: new Date(),
        likes: new Collection<Like>(this)
      };

      jest.spyOn(mockAnswerRepository, 'findOneOrFail').mockResolvedValue(answer);

      await expect(answerService.deleteAnswer('1', user)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAllAnswersByQuestion', () => {
    it('should return an array of answers', async () => {
      const questionId = '1';
      const user: User = { id: '1', name: 'User', email: 'user@example.com', password: 'password', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() };
      const question: Question = {
        id: '1',
        title: 'Test Question',
        content: 'Test Content',
        author: user,
        createdAt: new Date(),
        updatedAt: new Date(),
        answers: new Collection<Answer>(this),
        likes: new Collection<Like>(this)
      };
      const answers: Answer[] = [
        {
          id: '1',
          content: 'Test Answer 1',
          author: user,
          question,
          createdAt: new Date(),
          updatedAt: new Date(),
          likes: new Collection<Like>(this)
        },
        {
          id: '2',
          content: 'Test Answer 2',
          author: user,
          question,
          createdAt: new Date(),
          updatedAt: new Date(),
          likes: new Collection<Like>(this)
        },
      ];

      jest.spyOn(mockAnswerRepository, 'find').mockResolvedValue(answers);

      const result = await answerService.findAllAnswersByQuestion(questionId);

      expect(result).toEqual(answers.map(answer => ({
        id: answer.id,
        content: answer.content,
        createdAt: answer.createdAt,
        updatedAt: answer.updatedAt,
        authorId: answer.author.id,
        questionId: answer.question.id,
        isLiked: false,
      })));
      expect(mockAnswerRepository.find).toHaveBeenCalledWith({ question: { id: questionId } });
    });
  });
});