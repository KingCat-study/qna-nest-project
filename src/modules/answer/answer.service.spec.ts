import { Collection } from '@mikro-orm/core';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ExtendedEntityRepository } from '../../common/repositories/extended-entity-repository';
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
        find: jest.fn(),
        persistAndFlush: jest.fn(),
        removeAndFlush: jest.fn(),
    };

    const mockQuestionRepository = {
        findOne: jest.fn(),
    };

    const mockLikeService = {
        isAnswerLikedByUser: jest.fn(),
    };

    const mockExtendedEntityRepository = {
        findOneOrFail: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        persistAndFlush: jest.fn(),
        removeAndFlush: jest.fn(),
    };

    const user: User = {
        id: '1',
        name: 'User', 
        email: 'user@example.com', 
        password: 'password', 
        role: UserRole.USER, 
        createdAt: new Date(), 
        updatedAt: new Date()
    };

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

    const createAnswerDto: CreateAnswerDto = { 
        content: 'Test Answer', 
        questionId: question.id 
    };
    
    const answer: Answer = {
        id: '1',
        content: 'Test Answer',
        author: user,
        question,
        createdAt: new Date(),
        updatedAt: new Date(),
        likes: new Collection<Like>(this)
    };

    beforeEach(async () => {

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AnswerService,
                { provide: getRepositoryToken(Answer), useValue: mockAnswerRepository },
                { provide: getRepositoryToken(Question), useValue: mockQuestionRepository },
                { provide: LikeService, useValue: mockLikeService },
                { provide: ExtendedEntityRepository, useValue: mockExtendedEntityRepository },
            ],
        }).compile();

        answerService = module.get<AnswerService>(AnswerService);
    });

    it('should be defined', () => {
        expect(answerService).toBeDefined();
    });

    describe('createAnswer', () => {
        it('should create a new answer', async () => {


            mockQuestionRepository.findOne.mockResolvedValue(question);
            mockAnswerRepository.create.mockReturnValue(answer);
            mockAnswerRepository.persistAndFlush.mockResolvedValue(undefined);
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

            expect(mockAnswerRepository.create).toHaveBeenCalledWith({ content: createAnswerDto.content, author, question });
            expect(mockAnswerRepository.persistAndFlush).toHaveBeenCalledWith(answer);
        });
    });

    describe('updateAnswer', () => {
        it('should update an answer', async () => {
            
            const updateAnswerDto: UpdateAnswerDto = { 
                id: '1', 
                content: 'Updated Answer' };

            mockAnswerRepository.findOne.mockResolvedValue(answer);
            mockAnswerRepository.persistAndFlush.mockResolvedValue(undefined);
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

            expect(mockAnswerRepository.persistAndFlush).toHaveBeenCalledWith(answer);
        });

        it('should throw ForbiddenException if user is not the author or admin', async () => {

            const updateAnswerDto: UpdateAnswerDto = { 
                id: '1', 
                content: 'Updated Answer' 
            };

            const user: User = { 
                id: '2', 
                name: 'Other User', 
                email: 'other@example.com', 
                password: 'password', 
                role: UserRole.USER, 
                createdAt: new Date(), 
                updatedAt: new Date() 
            };

            mockAnswerRepository.findOne.mockResolvedValue(answer);

            await expect(answerService.updateAnswer(updateAnswerDto, user)).rejects.toThrow(ForbiddenException);
        });
    });

    describe('deleteAnswer', () => {
        it('should delete an answer', async () => {

            mockAnswerRepository.findOne.mockResolvedValue(answer);
            mockAnswerRepository.removeAndFlush.mockResolvedValue(undefined);

            await answerService.deleteAnswer('1', user);

            expect(mockAnswerRepository.removeAndFlush).toHaveBeenCalledWith(answer);

        });

        it('should throw ForbiddenException if user is not the author or admin', async () => {

            const user: User = { 
                id: '2', 
                name: 'Other User',
                email: 'other@example.com', 
                password: 'password', 
                role: UserRole.USER, 
                createdAt: new Date(), 
                updatedAt: new Date() 
            };

            mockAnswerRepository.findOne.mockResolvedValue(answer);

            await expect(answerService.deleteAnswer('1', user)).rejects.toThrow(ForbiddenException);
        });
    });


    describe('findAllAnswersByQuestion', () => {
        it('should return an array of answers', async () => {

            const questionId = '1';

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

            mockAnswerRepository.find.mockResolvedValue(answers);

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