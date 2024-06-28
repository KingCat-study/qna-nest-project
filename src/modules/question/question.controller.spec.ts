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
  let questionController: QuestionController;
  let questionService: QuestionService;

  const mockQuestionService = {
    createQuestion: jest.fn(),
    updateQuestion: jest.fn(),
    deleteQuestion: jest.fn(),
    findAllQuestions: jest.fn(),
    findOneQuestion: jest.fn(),
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

    questionController = module.get<QuestionController>(QuestionController);
    questionService = module.get<QuestionService>(QuestionService);
  });

  it('should be defined', () => {
    expect(questionController).toBeDefined();
  });

  describe('createQuestion', () => {
    it('should create a new question', async () => {
      const createQuestionDto: CreateQuestionDto = { title: 'Test Question', content: 'Test Content' };
      const user: User = { id: '1', name: 'Author', email: 'author@example.com', password: 'password', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() };
      const questionResponseDto: QuestionResponseDto = { 
        id: '1', 
        title: 'Test Question', 
        content: 'Test Content', 
        createdAt: new Date(), 
        updatedAt: new Date(), 
        authorId: '1',
        isLiked: false,
      };

      jest.spyOn(questionService, 'createQuestion').mockResolvedValue(questionResponseDto);

      const result = await questionController.createQuestion(createQuestionDto, user);

      expect(result).toEqual(questionResponseDto);
      expect(questionService.createQuestion).toHaveBeenCalledWith(createQuestionDto, user);
    });
  });

  describe('updateQuestion', () => {
    it('should update a question', async () => {
      const updateQuestionDto: UpdateQuestionDto = { id: '1', title: 'Updated Title', content: 'Updated Content' };
      const user: User = { id: '1', name: 'Author', email: 'author@example.com', password: 'password', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() };
      const questionResponseDto: QuestionResponseDto = { 
        id: '1', 
        title: 'Updated Title', 
        content: 'Updated Content', 
        createdAt: new Date(), 
        updatedAt: new Date(), 
        authorId: '1',
        isLiked: false,
      };

      jest.spyOn(questionService, 'updateQuestion').mockResolvedValue(questionResponseDto);

      const result = await questionController.updateQuestion(updateQuestionDto, user);

      expect(result).toEqual(questionResponseDto);
      expect(questionService.updateQuestion).toHaveBeenCalledWith({ ...updateQuestionDto, id: '1' }, user);
    });
  });

  describe('deleteQuestion', () => {
    it('should delete a question', async () => {
      const user: User = { id: '1', name: 'Author', email: 'author@example.com', password: 'password', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() };

      jest.spyOn(questionService, 'deleteQuestion').mockResolvedValue();

      await questionController.deleteQuestion('1', user);

      expect(questionService.deleteQuestion).toHaveBeenCalledWith('1', user);
    });

    it('should throw ForbiddenException if user is not the author or admin', async () => {
      const user: User = { id: '2', name: 'Other User', email: 'other@example.com', password: 'password', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() };

      jest.spyOn(questionService, 'deleteQuestion').mockImplementation(() => {
        throw new ForbiddenException();
      });

      await expect(questionController.deleteQuestion('1', user)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAllQuestions', () => {
    it('should return an array of questions', async () => {
      const questions: QuestionResponseDto[] = [
        { 
          id: '1', 
          title: 'Test Question 1', 
          content: 'Test Content 1', 
          createdAt: new Date(), 
          updatedAt: new Date(), 
          authorId: '1',
          isLiked: false,
        },
        { 
          id: '2', 
          title: 'Test Question 2', 
          content: 'Test Content 2', 
          createdAt: new Date(), 
          updatedAt: new Date(), 
          authorId: '1',
          isLiked: false,
        },
      ];

      jest.spyOn(questionService, 'findAllQuestions').mockResolvedValue(questions);

      const result = await questionController.findAllQuestions();

      expect(result).toEqual(questions);
      expect(questionService.findAllQuestions).toHaveBeenCalled();
    });
  });

  describe('findOneQuestion', () => {
    it('should return a single question', async () => {
      const question: QuestionResponseDto = { 
        id: '1', 
        title: 'Test Question', 
        content: 'Test Content', 
        createdAt: new Date(), 
        updatedAt: new Date(), 
        authorId: '1',
        isLiked: false,
      };

      jest.spyOn(questionService, 'findOneQuestion').mockResolvedValue(question);

      const result = await questionController.findOneQuestion('1');

      expect(result).toEqual(question);
      expect(questionService.findOneQuestion).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if question is not found', async () => {
      jest.spyOn(questionService, 'findOneQuestion').mockRejectedValue(new NotFoundException());

      await expect(questionController.findOneQuestion('1')).rejects.toThrow(NotFoundException);
    });
  });
});