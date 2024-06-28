import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '../user/entities/user-role.enum';
import { User } from '../user/entities/user.entity';
import { CreateQuestionDto } from './dtos/create-question.dto';
import { UpdateQuestionDto } from './dtos/update-question.dto';
import { Question } from './entities/question.entity';
import { QuestionService } from './question.service';

describe('QuestionService', () => {
  let service: QuestionService;
  let questionRepository: EntityRepository<Question>;
  let em: EntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionService,
        {
          provide: getRepositoryToken(Question),
          useValue: {
            create: jest.fn(),
            findOneOrFail: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: EntityManager,
          useValue: {
            persistAndFlush: jest.fn(),
            removeAndFlush: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<QuestionService>(QuestionService);
    questionRepository = module.get<EntityRepository<Question>>(getRepositoryToken(Question));
    em = module.get<EntityManager>(EntityManager);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createQuestion', () => {
    it('should create a new question', async () => {
      const createQuestionDto: CreateQuestionDto = { title: 'Test Question', content: 'Test Content' };
      const author: User = { id: '1', name: 'Author', email: 'author@example.com', password: 'password', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() };
      const question: Question = { ...createQuestionDto, id: '1', author, createdAt: new Date(), updatedAt: new Date() };

      jest.spyOn(questionRepository, 'create').mockReturnValue(question);
      jest.spyOn(em, 'persistAndFlush').mockResolvedValue();

      const result = await service.createQuestion(createQuestionDto, author);

      expect(result).toEqual({
        id: question.id,
        title: question.title,
        content: question.content,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
        authorId: question.author.id,
      });
      expect(questionRepository.create).toHaveBeenCalledWith({ ...createQuestionDto, author });
      expect(em.persistAndFlush).toHaveBeenCalledWith(question);
    });
  });

  describe('updateQuestion', () => {
    it('should update a question', async () => {
      const updateQuestionDto: UpdateQuestionDto = { id: '1', title: 'Updated Title', content: 'Updated Content' };
      const user: User = { id: '1', name: 'Author', email: 'author@example.com', password: 'password', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() };
      const question: Question = { id: '1', title: 'Test Question', content: 'Test Content', author: user, createdAt: new Date(), updatedAt: new Date() };

      jest.spyOn(questionRepository, 'findOneOrFail').mockResolvedValue(question);
      jest.spyOn(em, 'persistAndFlush').mockResolvedValue();

      const result = await service.updateQuestion(updateQuestionDto, user);

      expect(result).toEqual({
        id: question.id,
        title: updateQuestionDto.title,
        content: updateQuestionDto.content,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
        authorId: question.author.id,
      });
      expect(em.persistAndFlush).toHaveBeenCalledWith(question);
    });

    it('should throw ForbiddenException if user is not the author or admin', async () => {
      const updateQuestionDto: UpdateQuestionDto = { id: '1', title: 'Updated Title', content: 'Updated Content' };
      const user: User = { id: '2', name: 'Other User', email: 'other@example.com', password: 'password', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() };
      const question: Question = { id: '1', title: 'Test Question', content: 'Test Content', author: { id: '1', name: 'Author', email: 'author@example.com', password: 'password', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() }, createdAt: new Date(), updatedAt: new Date() };

      jest.spyOn(questionRepository, 'findOneOrFail').mockResolvedValue(question);

      await expect(service.updateQuestion(updateQuestionDto, user)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteQuestion', () => {
    it('should delete a question', async () => {
      const user: User = { id: '1', name: 'Author', email: 'author@example.com', password: 'password', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() };
      const question: Question = { id: '1', title: 'Test Question', content: 'Test Content', author: user, createdAt: new Date(), updatedAt: new Date() };

      jest.spyOn(questionRepository, 'findOneOrFail').mockResolvedValue(question);
      jest.spyOn(em, 'removeAndFlush').mockResolvedValue();

      await service.deleteQuestion('1', user);

      expect(em.removeAndFlush).toHaveBeenCalledWith(question);
    });

    it('should throw ForbiddenException if user is not the author or admin', async () => {
      const user: User = { id: '2', name: 'Other User', email: 'other@example.com', password: 'password', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() };
      const question: Question = { id: '1', title: 'Test Question', content: 'Test Content', author: { id: '1', name: 'Author', email: 'author@example.com', password: 'password', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() }, createdAt: new Date(), updatedAt: new Date() };

      jest.spyOn(questionRepository, 'findOneOrFail').mockResolvedValue(question);

      await expect(service.deleteQuestion('1', user)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('should return an array of questions', async () => {
      const questions: Question[] = [
        { id: '1', title: 'Test Question 1', content: 'Test Content 1', author: { id: '1', name: 'Author', email: 'author@example.com', password: 'password', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() }, createdAt: new Date(), updatedAt: new Date() },
        { id: '2', title: 'Test Question 2', content: 'Test Content 2', author: { id: '1', name: 'Author', email: 'author@example.com', password: 'password', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() }, createdAt: new Date(), updatedAt: new Date() },
      ];

      jest.spyOn(questionRepository, 'findAll').mockResolvedValue(questions);

      const result = await service.findAll();

      expect(result).toEqual(questions.map(question => ({
        id: question.id,
        title: question.title,
        content: question.content,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
        authorId: question.author.id,
      })));
    });
  });

  describe('findOne', () => {
    it('should return a single question', async () => {
      const question: Question = { id: '1', title: 'Test Question', content: 'Test Content', author: { id: '1', name: 'Author', email: 'author@example.com', password: 'password', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() }, createdAt: new Date(), updatedAt: new Date() };

      jest.spyOn(questionRepository, 'findOneOrFail').mockResolvedValue(question);

      const result = await service.findOne('1');

      expect(result).toEqual({
        id: question.id,
        title: question.title,
        content: question.content,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
        authorId: question.author.id,
      });
    });

    it('should throw NotFoundException if question is not found', async () => {
      jest.spyOn(questionRepository, 'findOneOrFail').mockRejectedValue(new NotFoundException());

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });
});