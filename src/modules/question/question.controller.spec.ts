import { Test, TestingModule } from '@nestjs/testing';
import { QuestionController } from './question.controller';
import { QuestionService } from './question.service';
import { CreateQuestionDto } from './dtos/create-question.dto';
import { UpdateQuestionDto } from './dtos/update-question.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../user/entities/user-role.enum';
import { User } from '../user/entities/user.entity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { QuestionResponseDto } from './dtos/question-response.dto';

describe('QuestionController', () => {
  let controller: QuestionController;
  let service: QuestionService;

  const mockQuestionService = {
    createQuestion: jest.fn(),
    updateQuestion: jest.fn(),
    deleteQuestion: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestionController],
      providers: [
        {
          provide: QuestionService,
          useValue: mockQuestionService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<QuestionController>(QuestionController);
    service = module.get<QuestionService>(QuestionService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createQuestion', () => {
    it('should create a new question', async () => {
      const createQuestionDto: CreateQuestionDto = { title: 'Test Question', content: 'Test Content' };
      const user: User = { id: '1', name: 'Author', email: 'author@example.com', password: 'password', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() };
      const questionResponseDto: QuestionResponseDto = { id: '1', title: 'Test Question', content: 'Test Content', createdAt: new Date(), updatedAt: new Date(), authorId: '1' };

      jest.spyOn(service, 'createQuestion').mockResolvedValue(questionResponseDto);

      const result = await controller.createQuestion(createQuestionDto, user);

      expect(result).toEqual(questionResponseDto);
      expect(service.createQuestion).toHaveBeenCalledWith(createQuestionDto, user);
    });
  });

  describe('updateQuestion', () => {
    it('should update a question', async () => {
      const updateQuestionDto: UpdateQuestionDto = { id: '1', title: 'Updated Title', content: 'Updated Content' };
      const user: User = { id: '1', name: 'Author', email: 'author@example.com', password: 'password', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() };
      const questionResponseDto: QuestionResponseDto = { id: '1', title: 'Updated Title', content: 'Updated Content', createdAt: new Date(), updatedAt: new Date(), authorId: '1' };

      jest.spyOn(service, 'updateQuestion').mockResolvedValue(questionResponseDto);

      const result = await controller.updateQuestion('1', updateQuestionDto, user);

      expect(result).toEqual(questionResponseDto);
      expect(service.updateQuestion).toHaveBeenCalledWith({ ...updateQuestionDto, id: '1' }, user);
    });
  });

  describe('deleteQuestion', () => {
    it('should delete a question', async () => {
      const user: User = { id: '1', name: 'Author', email: 'author@example.com', password: 'password', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() };

      jest.spyOn(service, 'deleteQuestion').mockResolvedValue();

      await controller.deleteQuestion('1', user);

      expect(service.deleteQuestion).toHaveBeenCalledWith('1', user);
    });

    it('should throw ForbiddenException if user is not the author or admin', async () => {
      const user: User = { id: '2', name: 'Other User', email: 'other@example.com', password: 'password', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() };

      jest.spyOn(service, 'deleteQuestion').mockImplementation(() => {
        throw new ForbiddenException();
      });

      await expect(controller.deleteQuestion('1', user)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('should return an array of questions', async () => {
      const questions: QuestionResponseDto[] = [
        { id: '1', title: 'Test Question 1', content: 'Test Content 1', createdAt: new Date(), updatedAt: new Date(), authorId: '1' },
        { id: '2', title: 'Test Question 2', content: 'Test Content 2', createdAt: new Date(), updatedAt: new Date(), authorId: '1' },
      ];

      jest.spyOn(service, 'findAll').mockResolvedValue(questions);

      const result = await controller.findAll();

      expect(result).toEqual(questions);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single question', async () => {
      const question: QuestionResponseDto = { id: '1', title: 'Test Question', content: 'Test Content', createdAt: new Date(), updatedAt: new Date(), authorId: '1' };

      jest.spyOn(service, 'findOne').mockResolvedValue(question);

      const result = await controller.findOne('1');

      expect(result).toEqual(question);
      expect(service.findOne).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if question is not found', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(controller.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });
});