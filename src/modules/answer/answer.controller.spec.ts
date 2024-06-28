// src/answer/answer.controller.spec.ts
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../user/entities/user-role.enum';
import { User } from '../user/entities/user.entity';
import { AnswerController } from './answer.controller';
import { AnswerService } from './answer.service';
import { AnswerResponseDto } from './dtos/answer-response.dto';
import { CreateAnswerDto } from './dtos/create-answer.dto';
import { UpdateAnswerDto } from './dtos/update-answer.dto';

describe('AnswerController', () => {
  let controller: AnswerController;
  let service: AnswerService;

  const mockAnswerService = {
    createAnswer: jest.fn(),
    updateAnswer: jest.fn(),
    deleteAnswer: jest.fn(),
    findAllAnswersByQuestion: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnswerController],
      providers: [
        {
          provide: AnswerService,
          useValue: mockAnswerService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<AnswerController>(AnswerController);
    service = module.get<AnswerService>(AnswerService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createAnswer', () => {
    it('should create a new answer', async () => {
      const createAnswerDto: CreateAnswerDto = { content: 'Test Answer', questionId: '1' };
      const user: User = { id: '1', name: 'Author', email: 'author@example.com', password: 'password', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() };
      const answerResponseDto: AnswerResponseDto = { id: '1', content: 'Test Answer', createdAt: new Date(), updatedAt: new Date(), authorId: '1', questionId: '1' };

      jest.spyOn(service, 'createAnswer').mockResolvedValue(answerResponseDto);

      const result = await controller.createAnswer(createAnswerDto, user);

      expect(result).toEqual(answerResponseDto);
      expect(service.createAnswer).toHaveBeenCalledWith(createAnswerDto, user);
    });
  });

  describe('updateAnswer', () => {
    it('should update an answer', async () => {
      const updateAnswerDto: UpdateAnswerDto = { id: '1', content: 'Updated Answer' };
      const user: User = { id: '1', name: 'Author', email: 'author@example.com', password: 'password', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() };
      const answerResponseDto: AnswerResponseDto = { id: '1', content: 'Updated Answer', createdAt: new Date(), updatedAt: new Date(), authorId: '1', questionId: '1' };

      jest.spyOn(service, 'updateAnswer').mockResolvedValue(answerResponseDto);

      const result = await controller.updateAnswer(updateAnswerDto, user);

      expect(result).toEqual(answerResponseDto);
      expect(service.updateAnswer).toHaveBeenCalledWith(updateAnswerDto, user);
    });
  });

  describe('deleteAnswer', () => {
    it('should delete an answer', async () => {
      const user: User = { id: '1', name: 'Author', email: 'author@example.com', password: 'password', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() };

      jest.spyOn(service, 'deleteAnswer').mockResolvedValue();

      await controller.deleteAnswer('1', user);

      expect(service.deleteAnswer).toHaveBeenCalledWith('1', user);
    });

    it('should throw ForbiddenException if user is not the author or admin', async () => {
      const user: User = { id: '2', name: 'Other User', email: 'other@example.com', password: 'password', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() };

      jest.spyOn(service, 'deleteAnswer').mockImplementation(() => {
        throw new ForbiddenException();
      });

      await expect(controller.deleteAnswer('1', user)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAllAnswersByQuestion', () => {
    it('should return an array of answers', async () => {
      const answers: AnswerResponseDto[] = [
        { id: '1', content: 'Test Answer 1', createdAt: new Date(), updatedAt: new Date(), authorId: '1', questionId: '1' },
        { id: '2', content: 'Test Answer 2', createdAt: new Date(), updatedAt: new Date(), authorId: '1', questionId: '1' },
      ];

      jest.spyOn(service, 'findAllAnswersByQuestion').mockResolvedValue(answers);

      const result = await controller.findAllAnswersByQuestion('1');

      expect(result).toEqual(answers);
      expect(service.findAllAnswersByQuestion).toHaveBeenCalledWith('1');
    });
  });
});