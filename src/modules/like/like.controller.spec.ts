import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '../auth/guards/auth.guard';
import { UserRole } from '../user/entities/user-role.enum';
import { User } from '../user/entities/user.entity';
import { LikeResponseDto } from './dtos/like-response.dto';
import { LikeController } from './like.controller';
import { LikeService } from './like.service';

describe('LikeController', () => {
  let likeController: LikeController;

  const mockLikeService = {
    toggleLikeQuestion: jest.fn(),
    toggleLikeAnswer: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const user: User = {
    id: '1',
    name: 'User',
    email: 'user@example.com',
    password: 'password',
    role: UserRole.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LikeController],
      providers: [
        { provide: LikeService, useValue: mockLikeService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    likeController = module.get<LikeController>(LikeController);
  });

  it('should be defined', () => {
    expect(likeController).toBeDefined();
  });

  describe('toggleLikeQuestion', () => {
    it('should toggle like status for a question', async () => {
      const likeResponseDto: LikeResponseDto = { message: 'Question like status toggled', liked: true };
      mockLikeService.toggleLikeQuestion.mockResolvedValue(likeResponseDto);

      const result = await likeController.toggleLikeQuestion('1', user);

      expect(result).toEqual(likeResponseDto);
      expect(mockLikeService.toggleLikeQuestion).toHaveBeenCalledWith('1', user);
    });

    it('should throw an error if trying to like own question', async () => {
      mockLikeService.toggleLikeQuestion.mockRejectedValue(new BadRequestException('You cannot like your own question.'));

      await expect(likeController.toggleLikeQuestion('1', user)).rejects.toThrow(BadRequestException);
    });
  });

  describe('toggleLikeAnswer', () => {
    it('should toggle like status for an answer', async () => {
      const likeResponseDto: LikeResponseDto = { message: 'Answer like status toggled', liked: true };
      mockLikeService.toggleLikeAnswer.mockResolvedValue(likeResponseDto);

      const result = await likeController.toggleLikeAnswer('1', user);

      expect(result).toEqual(likeResponseDto);
      expect(mockLikeService.toggleLikeAnswer).toHaveBeenCalledWith('1', user);
    });

    it('should throw an error if trying to like own answer', async () => {
      mockLikeService.toggleLikeAnswer.mockRejectedValue(new BadRequestException('You cannot like your own answer.'));

      await expect(likeController.toggleLikeAnswer('1', user)).rejects.toThrow(BadRequestException);
    });
  });
});