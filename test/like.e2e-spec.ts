import { getRepositoryToken } from '@mikro-orm/nestjs';
import { ExecutionContext, INestApplication, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthGuard } from '../src/modules/auth/guards/auth.guard';
import { Like } from '../src/modules/like/entities/like.entity';
import { LikeService } from '../src/modules/like/like.service';
import { UserRole } from '../src/modules/user/entities/user-role.enum';

const mockUser = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: UserRole.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
};

describe('LikeController (e2e)', () => {
    let app: INestApplication;
    let likeService: LikeService;

    const mockLikeRepository = {
        findOne: jest.fn(),
        create: jest.fn(),
    };

    const mockAuthGuard = {
        canActivate: jest.fn((context: ExecutionContext) => {
            const request = context.switchToHttp().getRequest();
            request.user = mockUser;
            return true;
        }),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(getRepositoryToken(Like)).useValue(mockLikeRepository) // Only override the repository
            .overrideGuard(AuthGuard).useValue(mockAuthGuard)
            .compile();

        app = moduleFixture.createNestApplication();
        likeService = app.get<LikeService>(LikeService); // Get the actual LikeService

        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('toggleLikeQuestion', () => {
        it('should toggle the like status of a question (PATCH /like/question/:id)', async () => {
            const questionId = '1';
            const mockResponse = { message: 'Question like status toggled', liked: true };

            jest.spyOn(likeService, 'toggleLikeQuestion').mockResolvedValue(mockResponse);

            const response = await request(app.getHttpServer())
                .patch(`/like/question/${questionId}`)
                .expect(200)
                .expect(mockResponse);

            expect(likeService.toggleLikeQuestion).toHaveBeenCalledWith(questionId, mockUser);
        });

        it('should return 401 Unauthorized if no valid user', async () => {
            const questionId = '1';
            mockAuthGuard.canActivate.mockReturnValueOnce(false);

            await request(app.getHttpServer())
                .patch(`/like/question/${questionId}`)
                .expect(403);

            mockAuthGuard.canActivate.mockReturnValue(true);

            await request(app.getHttpServer())
                .patch(`/like/question/${questionId}`)
                .expect(200);
        });

        it('should handle 404 Not Found when question is not found', async () => {
            const questionId = '2';

            jest.spyOn(likeService, 'toggleLikeQuestion').mockRejectedValue(new NotFoundException('Question not found'));

            await request(app.getHttpServer())
                .patch(`/like/question/${questionId}`)
                .expect(404); // Expect Not Found
        });

    });

});
