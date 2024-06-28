import { Collection, EntityManager } from '@mikro-orm/core';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LikeService } from '../like/like.service';
import { UserRole } from '../user/entities/user-role.enum';
import { User } from '../user/entities/user.entity';
import { CreateQuestionDto } from './dtos/create-question.dto';
import { UpdateQuestionDto } from './dtos/update-question.dto';
import { Question } from './entities/question.entity';
import { QuestionService } from './question.service';
import { Answer } from '../answer/entities/answer.entity';
import { Like } from '../like/entities/like.entity';

describe('QuestionService', () => {
  let questionService: QuestionService;
  let likeService: LikeService;
  let em: EntityManager;

  const mockQuestionRepository = {
    create: jest.fn(),
    findOneOrFail: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  const mockEntityManager = {
    persistAndFlush: jest.fn(),
    removeAndFlush: jest.fn(),
    findOneOrFail: jest.fn(),
  };

  const mockLikeService = {
    isQuestionLikedByUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionService,
        { provide: getRepositoryToken(Question), useValue: mockQuestionRepository },
        { provide: EntityManager, useValue: mockEntityManager },
        { provide: LikeService, useValue: mockLikeService },
      ],
    }).compile();

    questionService = module.get<QuestionService>(QuestionService);
    likeService = module.get<LikeService>(LikeService);
    em = module.get<EntityManager>(EntityManager);
  });

  it('should be defined', () => {
    expect(questionService).toBeDefined();
  });

  describe('createQuestion', () => {
    it('should create a new question', async () => {
      const createQuestionDto: CreateQuestionDto = { title: 'Test Question', content: 'Test Content' };
      const user: User = { id: '1', name: 'User', email: 'user@example.com', password: 'password', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() };
      const question: Question = {
        ...createQuestionDto,
        id: '1',
        author: user,
        createdAt: new Date(),
        updatedAt: new Date(),
        answers: new Collection<Answer>(this),
        likes: new Collection<Like>(this),
      };
      jest.spyOn(mockQuestionRepository, 'create').mockReturnValue(question);
      jest.spyOn(em, 'persistAndFlush').mockResolvedValue(undefined);

      const result = await questionService.createQuestion(createQuestionDto, user);

      expect(result).toEqual({
        id: question.id,
        title: question.title,
        content: question.content,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
        authorId: question.author.id,
        isLiked: false,
      });
      expect(mockQuestionRepository.create).toHaveBeenCalledWith({ ...createQuestionDto, author: user });
      expect(em.persistAndFlush).toHaveBeenCalledWith(question);
    });
  });

  describe('updateQuestion', () => {
    it('should update a question', async () => {
      const updateQuestionDto: UpdateQuestionDto = { id: '1', title: 'Updated Title', content: 'Updated Content' };
      const user: User = { id: '1', name: 'User', email: 'user@example.com', password: 'password', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() };
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
      
      jest.spyOn(mockQuestionRepository, 'findOneOrFail').mockResolvedValue(question);
      jest.spyOn(em, 'persistAndFlush').mockResolvedValue(undefined);
      jest.spyOn(likeService, 'isQuestionLikedByUser').mockResolvedValue(false);

      const result = await questionService.updateQuestion(updateQuestionDto, user);

      expect(result).toEqual({
        id: question.id,
        title: updateQuestionDto.title,
        content: updateQuestionDto.content,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
        authorId: question.author.id,
        isLiked: false,
      });
      expect(em.persistAndFlush).toHaveBeenCalledWith(question);
    });

    it('should throw ForbiddenException if user is not the author or admin', async () => {
      const updateQuestionDto: UpdateQuestionDto = { id: '1', title: 'Updated Title', content: 'Updated Content' };
      const user: User = { id: '2', name: 'Other User', email: 'other@example.com', password: 'password', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() };
      const question: Question = {
        id: '1',
        title: 'Test Question',
        content: 'Test Content',
        author: { id: '1', name: 'Author', email: 'author@example.com', password: 'password', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() },
        createdAt: new Date(),
        updatedAt: new Date(),
        answers: new Collection<Answer>(this),
        likes: new Collection<Like>(this),
      };
      jest.spyOn(mockQuestionRepository, 'findOneOrFail').mockResolvedValue(question);

      await expect(questionService.updateQuestion(updateQuestionDto, user)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteQuestion', () => {
    it('should delete a question', async () => {
      const user: User = { id: '1', name: 'User', email: 'user@example.com', password: 'password', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() };
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
      jest.spyOn(mockQuestionRepository, 'findOneOrFail').mockResolvedValue(question);
      jest.spyOn(em, 'removeAndFlush').mockResolvedValue(undefined);

      await questionService.deleteQuestion('1', user);

      expect(em.removeAndFlush).toHaveBeenCalledWith(question);
    });

    it('should throw ForbiddenException if user is not the author or admin', async () => {
      const user: User = { id: '2', name: 'Other User', email: 'other@example.com', password: 'password', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() };
      const question: Question = {
        id: '1',
        title: 'Test Question',
        content: 'Test Content',
        author: { id: '1', name: 'Author', email: 'author@example.com', password: 'password', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() },
        createdAt: new Date(),
        updatedAt: new Date(),
        answers: new Collection<Answer>(this),
        likes: new Collection<Like>(this),
      };
      jest.spyOn(mockQuestionRepository, 'findOneOrFail').mockResolvedValue(question);

      await expect(questionService.deleteQuestion('1', user)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAllQuestions', () => {
    it('should return an array of questions', async () => {
      const user: User = { id: '1', name: 'User', email: 'user@example.com', password: 'password', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() };
      const questions: Question[] = [
        {
          id: '1',
          title: 'Test Question 1',
          content: 'Test Content 1',
          author: user,
          createdAt: new Date(),
          updatedAt: new Date(),
          answers: new Collection<Answer>(this),
          likes: new Collection<Like>(this),
        },
        {
          id: '2',
          title: 'Test Question 2',
          content: 'Test Content 2',
          author: user,
          createdAt: new Date(),
          updatedAt: new Date(),
          answers: new Collection<Answer>(this),
          likes: new Collection<Like>(this),
        },
      ];

      jest.spyOn(mockQuestionRepository, 'findAll').mockResolvedValue(questions);
      jest.spyOn(likeService, 'isQuestionLikedByUser').mockResolvedValue(false);

      const result = await questionService.findAllQuestions(user);

      expect(result).toEqual(questions.map(question => ({
        id: question.id,
        title: question.title,
        content: question.content,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
        authorId: question.author.id,
        isLiked: false,
      })));
      expect(mockQuestionRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('findOneQuestion', () => {
    it('should return a single question', async () => {
      const user: User = { id: '1', name: 'User', email: 'user@example.com', password: 'password', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() };
      const question: Question = {
        id: '1',
        title: 'Test Question',
        content: 'Test Content',
        author: user,
        createdAt: new Date(),
        updatedAt: new Date(),
        answers: new Collection(this),
        likes: new Collection(this),
        };
      jest.spyOn(mockQuestionRepository, 'findOneOrFail').mockResolvedValue(question);
      jest.spyOn(likeService, 'isQuestionLikedByUser').mockResolvedValue(false);
  
      const result = await questionService.findOneQuestion('1', user);
  
      expect(result).toEqual({
        id: question.id,
        title: question.title,
        content: question.content,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
        authorId: question.author.id,
        isLiked: false,
      });
      expect(mockQuestionRepository.findOneOrFail).toHaveBeenCalledWith('1', { populate: ['author'] });
    });
  
    it('should throw NotFoundException if question is not found', async () => {
      jest.spyOn(mockQuestionRepository, 'findOneOrFail').mockRejectedValue(new NotFoundException());
  
      await expect(questionService.findOneQuestion('1', {} as User)).rejects.toThrow(NotFoundException);
    });
  });
});
