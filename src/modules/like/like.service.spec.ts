import { Collection } from '@mikro-orm/core';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ExtendedEntityRepository } from '../../common/repositories/extended-entity-repository';
import { Answer } from '../answer/entities/answer.entity';
import { Question } from '../question/entities/question.entity';
import { UserRole } from '../user/entities/user-role.enum';
import { User } from '../user/entities/user.entity';
import { Like } from './entities/like.entity';
import { LikeService } from './like.service';



describe('LikeService', () => {
    let likeService: LikeService;

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
        content: 'Content',
        author: { ...user, id: '2' },
        question,
        createdAt: new Date(),
        updatedAt: new Date(),
        likes: new Collection<Like>(this),
    }

    const like: Like = {
        id: '1',
        user,
        question,
        createdAt: new Date(),
    };

    const mockLikeRepository = {
        findOne: jest.fn(),
        create: jest.fn(),
        persistAndFlush: jest.fn(),
        removeAndFlush: jest.fn(),
    };

    const mockQuestionRepository = {
        findOne: jest.fn(),
    };

    const mockAnswerRepository = {
        findOne: jest.fn(),
    };

    const mockExtendedEntityRepository = {
        findOneOrFail: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        persistAndFlush: jest.fn(),
        removeAndFlush: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LikeService,
                { provide: getRepositoryToken(Like), useValue: mockLikeRepository },
                { provide: getRepositoryToken(Question), useValue: mockQuestionRepository },
                { provide: getRepositoryToken(Answer), useValue: mockAnswerRepository },
                { provide: ExtendedEntityRepository, useValue: mockExtendedEntityRepository },
            ],
        }).compile();

        likeService = module.get<LikeService>(LikeService);
    });

    it('should be defined', () => {
        expect(likeService).toBeDefined();
    });

    describe('toggleLikeQuestion', () => {

        it('should like a question', async () => {

            mockQuestionRepository.findOne.mockResolvedValue(question);
            mockLikeRepository.findOne.mockResolvedValue(null);
            jest.spyOn(likeService, 'findLike').mockResolvedValue(null);
            jest.spyOn(likeService, 'createLike').mockReturnValue(like);
            mockLikeRepository.persistAndFlush.mockResolvedValue(undefined);

            const result = await likeService.toggleLikeQuestion('1', user);

            expect(result).toEqual({ message: 'Question like status toggled', liked: true });
            expect(mockQuestionRepository.findOne).toHaveBeenCalledWith({ id: '1' });
            expect(likeService.findLike).toHaveBeenCalledWith(question, user);
            expect(likeService.createLike).toHaveBeenCalledWith(question, user);
            expect(mockLikeRepository.persistAndFlush).toHaveBeenCalledWith(like);

        });

        it('should unlike a question', async () => {

            mockQuestionRepository.findOne.mockResolvedValue(question);
            mockLikeRepository.findOne.mockResolvedValue(like);
            jest.spyOn(likeService, 'findLike').mockResolvedValue(like);
            mockLikeRepository.removeAndFlush.mockResolvedValue(undefined);

            const result = await likeService.toggleLikeQuestion('1', user);

            expect(result).toEqual({ message: 'Question like status toggled', liked: false });
            expect(mockQuestionRepository.findOne).toHaveBeenCalledWith({ id: '1' });
            expect(likeService.findLike).toHaveBeenCalledWith(question, user);
            expect(mockLikeRepository.removeAndFlush).toHaveBeenCalledWith(like);
        });

        it('should throw an error if trying to like own question', async () => {

            mockQuestionRepository.findOne.mockResolvedValue(null);

            await expect(likeService.toggleLikeQuestion('5', user)).rejects.toThrow(NotFoundException);
            expect(mockQuestionRepository.findOne).toHaveBeenCalledWith({ id: '5' });
        });

    });

    describe('toggleLikeAnswer', () => {

        it('should like an answer', async () => {

            mockAnswerRepository.findOne.mockResolvedValue(answer);
            mockLikeRepository.findOne.mockResolvedValue(null);
            jest.spyOn(likeService, 'findLike').mockResolvedValue(null);
            jest.spyOn(likeService, 'createLike').mockReturnValue(like);
            mockLikeRepository.persistAndFlush.mockResolvedValue(undefined);

            const result = await likeService.toggleLikeAnswer('1', user);

            expect(result).toEqual({ message: 'Answer like status toggled', liked: true });
            expect(mockAnswerRepository.findOne).toHaveBeenCalledWith({ id: '1' });
            expect(likeService.findLike).toHaveBeenCalledWith(answer, user);
            expect(likeService.createLike).toHaveBeenCalledWith(answer, user);
            expect(mockLikeRepository.persistAndFlush).toHaveBeenCalledWith(like);
        });

        it('should unlike an answer', async () => {

            mockAnswerRepository.findOne.mockResolvedValue(answer);
            mockLikeRepository.findOne.mockResolvedValue(like);
            jest.spyOn(likeService, 'findLike').mockResolvedValue(like);
            mockLikeRepository.removeAndFlush.mockResolvedValue(undefined);

            const result = await likeService.toggleLikeAnswer('1', user);

            expect(result).toEqual({ message: 'Answer like status toggled', liked: false });
            expect(mockAnswerRepository.findOne).toHaveBeenCalledWith({ id: '1' });
            expect(likeService.findLike).toHaveBeenCalledWith(answer, user);
            expect(mockLikeRepository.removeAndFlush).toHaveBeenCalledWith(like);
        });

        it('should throw an error if trying to like own answer', async () => {

            mockAnswerRepository.findOne.mockResolvedValue(null);

            await expect(likeService.toggleLikeAnswer('5', user)).rejects.toThrow(NotFoundException);
            expect(mockAnswerRepository.findOne).toHaveBeenCalledWith({ id: '5' });
        });

    });

});