import { Test, TestingModule } from '@nestjs/testing';
import { LikeService } from './like.service';
import { EntityManager, Collection } from '@mikro-orm/core';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Like } from './entities/like.entity';
import { User } from '../user/entities/user.entity';
import { Question } from '../question/entities/question.entity';
import { Answer } from '../answer/entities/answer.entity';
import { BadRequestException } from '@nestjs/common';
import { UserRole } from '../user/entities/user-role.enum';

describe('LikeService', () => {
  let likeService: LikeService;

  const mockLikeRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const mockEntityManager = {
    findOneOrFail: jest.fn(),
    persistAndFlush: jest.fn(),
    removeAndFlush: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LikeService,
        { provide: getRepositoryToken(Like), useValue: mockLikeRepository },
        { provide: EntityManager, useValue: mockEntityManager },
      ],
    }).compile();

    likeService = module.get<LikeService>(LikeService);
  });

  it('should be defined', () => {
    expect(likeService).toBeDefined();
  });

  describe('toggleLikeQuestion', () => {
    it('should like a question', async () => {
      const user: User = {
        id: '1',
        name: 'User',
        email: 'user@example.com',
        password: 'password',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const question: Question = {
        id: '1',
        title: 'Question',
        content: 'Content',
        author: { ...user, id: '2' }, // Ensure author is different
        createdAt: new Date(),
        updatedAt: new Date(),
        answers: new Collection<Answer>(this),
        likes: new Collection<Like>(this),
      };

      const like: Like = {
        id: '1',
        user,
        question,
        createdAt: new Date(),
      };

      mockEntityManager.findOneOrFail.mockResolvedValue(question);
      mockLikeRepository.findOne.mockResolvedValue(null);
      jest.spyOn(likeService, 'findLike').mockResolvedValue(null);
      jest.spyOn(likeService, 'createLike').mockReturnValue(like);
      mockEntityManager.persistAndFlush.mockResolvedValue(undefined);

      const result = await likeService.toggleLikeQuestion('1', user);

      expect(result).toEqual({ message: 'Question like status toggled', liked: true });
      expect(mockEntityManager.findOneOrFail).toHaveBeenCalledWith(Question, '1');
      expect(likeService.findLike).toHaveBeenCalledWith(question, user); // Check findLike called correctly
      expect(likeService.createLike).toHaveBeenCalledWith(question, user);
      expect(mockEntityManager.persistAndFlush).toHaveBeenCalledWith(like);
    });

    it('should unlike a question', async () => {
      const user: User = {
        id: '1',
        name: 'User',
        email: 'user@example.com',
        password: 'password',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const question: Question = {
        id: '1',
        title: 'Question',
        content: 'Content',
        author: { ...user, id: '2' },
        createdAt: new Date(),
        updatedAt: new Date(),
        answers: new Collection<Answer>(this),
        likes: new Collection<Like>(this),
      };
      const like: Like = { id: '1', user, question, createdAt: new Date() };

      mockEntityManager.findOneOrFail.mockResolvedValue(question);
      mockLikeRepository.findOne.mockResolvedValue(like);
      mockEntityManager.removeAndFlush.mockResolvedValue(undefined);

      const findLikeSpy = jest.spyOn(likeService, 'findLike');
      findLikeSpy.mockResolvedValue(like);

      const result = await likeService.toggleLikeQuestion('1', user);

      expect(result).toEqual({ message: 'Question like status toggled', liked: false });
      expect(mockEntityManager.findOneOrFail).toHaveBeenCalledWith(Question, '1');
      expect(findLikeSpy).toHaveBeenCalledWith(question, user);
      expect(mockEntityManager.removeAndFlush).toHaveBeenCalledWith(like);
    });

    it('should throw an error if trying to like own question', async () => {
      const user: User = {
        id: '1',
        name: 'User',
        email: 'user@example.com',
        password: 'password',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const question: Question = {
        id: '1',
        title: 'Question',
        content: 'Content',
        author: user,
        createdAt: new Date(),
        updatedAt: new Date(),
        answers: new Collection<Answer>(this),
        likes: new Collection<Like>(this),
      };

      mockEntityManager.findOneOrFail.mockResolvedValue(question);
      mockLikeRepository.findOne.mockResolvedValue(null);

      await expect(likeService.toggleLikeQuestion('1', user)).rejects.toThrow(BadRequestException);
    });

  });


  describe('toggleLikeAnswer', () => {
    it('should like an answer', async () => {
      const user: User = {
        id: '1',
        name: 'User',
        email: 'user@example.com',
        password: 'password',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const question: Question = {
        id: '1',
        title: 'Question',
        content: 'Content',
        author: { ...user, id: '2' },
        createdAt: new Date(),
        updatedAt: new Date(),
        answers: new Collection<Answer>(this),
        likes: new Collection<Like>(this),
      };
      const answer: Answer = {
        id: '1',
        content: 'Answer',
        author: { ...user, id: '2' },
        question,
        createdAt: new Date(),
        updatedAt: new Date(),
        likes: new Collection<Like>(this),
      };

      mockEntityManager.findOneOrFail.mockResolvedValue(answer);

      const findLikeSpy = jest.spyOn(likeService, 'findLike');
      findLikeSpy.mockResolvedValue(null); // Initially no like exists

      const createLikeSpy = jest.spyOn(likeService, 'createLike'); // Spy on createLike
      createLikeSpy.mockReturnValue({
        id: '1',
        user,
        answer,
        createdAt: new Date(),
      });

      const result = await likeService.toggleLikeAnswer('1', user);

      expect(result).toEqual({ message: 'Answer like status toggled', liked: true });
      expect(mockEntityManager.findOneOrFail).toHaveBeenCalledWith(Answer, '1');
      expect(findLikeSpy).toHaveBeenCalledWith(answer, user);
      expect(createLikeSpy).toHaveBeenCalledWith(answer, user);
      expect(mockEntityManager.persistAndFlush).toHaveBeenCalledWith(expect.objectContaining({
        user,
        answer
      }));
    });

    it('should unlike an answer', async () => {
      const user: User = {
        id: '1',
        name: 'User',
        email: 'user@example.com',
        password: 'password',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const question: Question = {
        id: '1',
        title: 'Question',
        content: 'Content',
        author: { ...user, id: '2' },
        createdAt: new Date(),
        updatedAt: new Date(),
        answers: new Collection<Answer>(this),
        likes: new Collection<Like>(this),
      };
      const answer: Answer = {
        id: '1',
        content: 'Answer',
        author: { ...user, id: '2' },
        question,
        createdAt: new Date(),
        updatedAt: new Date(),
        likes: new Collection<Like>(this),
      };

      const like: Like = { id: '1', user, answer, createdAt: new Date() };

      mockEntityManager.findOneOrFail.mockResolvedValue(answer);

      // Spy directly on the findLike method and control its behavior
      const findLikeSpy = jest.spyOn(likeService, 'findLike');
      findLikeSpy.mockResolvedValue(like); // Simulate an existing like

      mockEntityManager.removeAndFlush.mockResolvedValue(undefined); // Simulate successful removal

      const result = await likeService.toggleLikeAnswer('1', user);

      expect(result).toEqual({ message: 'Answer like status toggled', liked: false });
      expect(mockEntityManager.findOneOrFail).toHaveBeenCalledWith(Answer, '1');
      expect(findLikeSpy).toHaveBeenCalledWith(answer, user);
      expect(mockEntityManager.removeAndFlush).toHaveBeenCalledWith(like); // Ensure the like is removed
    });

    it('should throw an error if trying to like own answer', async () => {
      const user: User = {
        id: '1',
        name: 'User',
        email: 'user@example.com',
        password: 'password',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const question: Question = {
        id: '1',
        title: 'Question',
        content: 'Content',
        author: { ...user, id: '2' },
        createdAt: new Date(),
        updatedAt: new Date(),
        answers: new Collection<Answer>(this),
        likes: new Collection<Like>(this),
      };
      const answer: Answer = {
        id: '1',
        content: 'Answer',
        author: user,
        question,
        createdAt: new Date(),
        updatedAt: new Date(),
        likes: new Collection<Like>(this),
      };

      mockEntityManager.findOneOrFail.mockResolvedValue(answer);
      mockLikeRepository.findOne.mockResolvedValue(null);

      await expect(likeService.toggleLikeAnswer('1', user)).rejects.toThrow(BadRequestException);
    });
  });

});