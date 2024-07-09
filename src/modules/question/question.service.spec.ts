import { Collection, EntityManager } from '@mikro-orm/core';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Test, TestingModule } from '@nestjs/testing';
import { Answer } from '../answer/entities/answer.entity';
import { Like } from '../like/entities/like.entity';
import { UserRole } from '../user/entities/user-role.enum';
import { User } from '../user/entities/user.entity';
import { CreateQuestionDto } from './dtos/create-question.dto';
import { Question } from './entities/question.entity';
import { QuestionService } from './question.service';
import { LikeService } from '../like/like.service';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';

describe('QuestionService', () => {
    let questionService: QuestionService;
    let mockQuestionRepository;
    let mockEntityManager;


    const mockUser: User = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const mockQuestion: Question = {
        id: '1',
        title: 'Test Question',
        content: 'Test Content',
        author: mockUser,
        createdAt: new Date(),
        updatedAt: new Date(),
        answers: new Collection<Answer>(this),
        likes: new Collection<Like>(this),
    };

    const mockLikeService = {
        isQuestionLikedByUser: jest.fn(),
      };

    beforeEach(async () => {
        mockQuestionRepository = {
            create: jest.fn(),
            findOneOrFail: jest.fn(),
            findOne: jest.fn(),
            findAll: jest.fn(),
            persistAndFlush: jest.fn(),
            removeAndFlush: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                QuestionService,
                { provide: getRepositoryToken(Question), useValue: mockQuestionRepository },
                { provide: LikeService, useValue: mockLikeService },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        questionService = module.get<QuestionService>(QuestionService);

    });

    it('should be defined', () => {
        expect(questionService).toBeDefined();
    });

    describe('createQuestion', () => {
        it('should create a new question', async () => {
            const createQuestionDto: CreateQuestionDto = {
                title: 'Test Question',
                content: 'Test Content',
            };

            mockQuestionRepository.create.mockReturnValue(mockQuestion);
            mockQuestionRepository.persistAndFlush.mockResolvedValue(mockQuestion);

            const result = await questionService.createQuestion(createQuestionDto, mockUser);

            expect(mockQuestionRepository.create).toHaveBeenCalledWith({
                ...createQuestionDto,
                author: mockUser,
              });
            expect(mockQuestionRepository.persistAndFlush).toHaveBeenCalledWith(mockQuestion);
            expect(result).toEqual({
                id: mockQuestion.id,
                title: mockQuestion.title,
                content: mockQuestion.content,
                createdAt: mockQuestion.createdAt,
                updatedAt: mockQuestion.updatedAt,
                authorId: mockUser.id,
                isLiked: false,
            });
        });
    });

    describe('updateQuestion', () => {
        it('should update a question', async () => {
            const updateQuestionDto = {
                id: '1',
                title: 'Updated Title',
                content: 'Updated Content',
            };

            mockQuestionRepository.findOne.mockResolvedValue(mockQuestion);

            const result = await questionService.updateQuestion(updateQuestionDto, mockUser);

            expect(mockQuestionRepository.findOne).toHaveBeenCalledWith(updateQuestionDto.id, { populate: ['author'] });
            expect(mockQuestionRepository.persistAndFlush).toHaveBeenCalledWith(mockQuestion);
            expect(result).toEqual({
                id: mockQuestion.id,
                title: mockQuestion.title,
                content: mockQuestion.content,
                createdAt: mockQuestion.createdAt,
                updatedAt: mockQuestion.updatedAt,
                authorId: mockUser.id,
                isLiked: false,
            });
        });

        it('should throw an error if the question does not exist', async () => {
            const updateQuestionDto = {
                id: '1',
                title: 'Updated Title',
                content: 'Updated Content',
            };

            mockQuestionRepository.findOne.mockResolvedValue(null);

            await expect(questionService.updateQuestion(updateQuestionDto, mockUser)).rejects.toThrow(new NotFoundException('Question not found'));
        });
    
        it('should throw an error if the user does not have permission to update the question', async () => {
            const updateQuestionDto = {
                id: '1',
                title: 'Updated Title',
                content: 'Updated Content',
            };
            
            const anotherUser = { ...mockUser, id: '2' };

            mockQuestionRepository.findOne.mockResolvedValue(mockQuestion);
            await expect(questionService.updateQuestion(updateQuestionDto, anotherUser)).rejects.toThrow( new UnauthorizedException(`You do not have permission to update this question`));
        });
    });

    describe('deleteQuestion', () => {
        it('should delete a question', async () => {
            mockQuestionRepository.findOneOrFail.mockResolvedValue(mockQuestion);

            await questionService.deleteQuestion(mockQuestion.id, mockUser);

            expect(mockQuestionRepository.findOneOrFail).toHaveBeenCalledWith(mockQuestion.id, { populate: ['author'] });
            expect(mockQuestionRepository.removeAndFlush).toHaveBeenCalledWith(mockQuestion);
        });

        it('should throw an error if the question does not exist', async () => {
            mockQuestionRepository.findOneOrFail.mockRejectedValue(new Error('Question not found'));

            await expect(questionService.deleteQuestion(mockQuestion.id, mockUser)).rejects.toThrow(new NotFoundException('Question not found'));
        });

        it('should throw an error if the user does not have permission to delete the question', async () => {
            const anotherUser = { ...mockUser, id: '2' };

            mockQuestionRepository.findOneOrFail.mockResolvedValue(mockQuestion);

            await expect(questionService.deleteQuestion(mockQuestion.id, anotherUser)).rejects.toThrow(new UnauthorizedException(`You do not have permission to delete this question`));
        });
    });

    describe('findAllQuestions', () => {
        it('should return all questions', async () => {
            mockQuestionRepository.findAll.mockResolvedValue([mockQuestion]);

            const result = await questionService.findAllQuestions(mockUser);

            expect(mockQuestionRepository.findAll).toHaveBeenCalled();
            expect(result).toEqual([
                {
                    id: mockQuestion.id,
                    title: mockQuestion.title,
                    content: mockQuestion.content,
                    createdAt: mockQuestion.createdAt,
                    updatedAt: mockQuestion.updatedAt,
                    authorId: mockUser.id,
                    isLiked: undefined,
                },
            ]);
        });
        it('should return an empty array if no questions are found', async () => {
            mockQuestionRepository.findAll.mockResolvedValue([]);

            const result = await questionService.findAllQuestions(mockUser);

            expect(mockQuestionRepository.findAll).toHaveBeenCalled();
            expect(result).toEqual([]);
        });
        
        it('should return all questions with isLiked property', async () => {

            mockQuestionRepository.findAll.mockResolvedValue([mockQuestion]);
            mockLikeService.isQuestionLikedByUser.mockResolvedValue(true);

            const result = await questionService.findAllQuestions(mockUser);

            expect(mockQuestionRepository.findAll).toHaveBeenCalled();
            expect(result).toEqual([
                {
                    id: mockQuestion.id,
                    title: mockQuestion.title,
                    content: mockQuestion.content,
                    createdAt: mockQuestion.createdAt,
                    updatedAt: mockQuestion.updatedAt,
                    authorId: mockUser.id,
                    isLiked: true,
                },
            ]);
        });
    });

    describe('findOneQuestion', () => {
        it('should return a question', async () => {
            mockQuestionRepository.findOneOrFail.mockResolvedValue(mockQuestion);
            mockLikeService.isQuestionLikedByUser.mockResolvedValue(false);

            const result = await questionService.findOneQuestion(mockQuestion.id, mockUser);

            expect(mockQuestionRepository.findOneOrFail).toHaveBeenCalledWith(mockQuestion.id);
            expect(result).toEqual({
                id: mockQuestion.id,
                title: mockQuestion.title,
                content: mockQuestion.content,
                createdAt: mockQuestion.createdAt,
                updatedAt: mockQuestion.updatedAt,
                authorId: mockUser.id,
                isLiked: false,
            });
        });

        it('should throw an error if the question does not exist', async () => {
            mockQuestionRepository.findOneOrFail.mockRejectedValue(new Error('Question not found'));

            await expect(questionService.findOneQuestion(mockQuestion.id, mockUser)).rejects.toThrow(new NotFoundException('Question not found'));
        });

        it('should return a question with isLiked property', async () => {
            mockQuestionRepository.findOneOrFail.mockResolvedValue(mockQuestion);
            mockLikeService.isQuestionLikedByUser.mockResolvedValue(true);

            const result = await questionService.findOneQuestion(mockQuestion.id, mockUser);

            expect(mockQuestionRepository.findOneOrFail).toHaveBeenCalledWith(mockQuestion.id);
            expect(result).toEqual({
                id: mockQuestion.id,
                title: mockQuestion.title,
                content: mockQuestion.content,
                createdAt: mockQuestion.createdAt,
                updatedAt: mockQuestion.updatedAt,
                authorId: mockUser.id,
                isLiked: true,
            });
        });
        
    });


});
