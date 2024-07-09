import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/sqlite';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { Login } from './entities/login.entity';

jest.mock('bcrypt');
jest.mock('crypto', () => {
    const actualCrypto = jest.requireActual('crypto');
    return {
        ...actualCrypto,
        randomBytes: jest.fn(() => Buffer.from('randomToken', 'utf8').toString('hex')),
    };
});

describe('AuthService', () => {
    let authService: AuthService;
    let mockAuthRepository;
    let mockEntityManager

    const token = Buffer.from('randomToken', 'utf8').toString('hex');

    const mockUserService = {
        findUserByEmail: jest.fn(),
    };

    const loginInfo = {
        email: 'test@email.com',
        password: 'plainPassword'
    }

    beforeEach(async () => {
        mockAuthRepository = {
            create: jest.fn(),
            persistAndFlush: jest.fn(),
            findOne: jest.fn(),
            removeAndFlush: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: UserService, useValue: mockUserService },
                { provide: getRepositoryToken(Login), useValue: mockAuthRepository }, // authRepository 주입
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        authService = module.get<AuthService>(AuthService);

        jest.spyOn(bcrypt, 'compare').mockImplementation((plainText, hash) => {
            return plainText === 'plainPassword' && hash === 'hashedPassword';
        });


    });

    it('should be defined', () => {
        expect(authService).toBeDefined();
        expect(mockUserService).toBeDefined();
        expect(bcrypt).toBeDefined();
    });

    describe('validateUser', () => {
        it('should return user if credentials are valid', async () => {

            const user = new User();
            user.password = await bcrypt.hash(loginInfo.password, 10); // 비밀번호 해시화
            user.email = loginInfo.email;
            user.createdAt = new Date();
            user.updatedAt = new Date();

            mockUserService.findUserByEmail.mockResolvedValue(user);

            jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

            const result = await authService.validateUser(user.email, loginInfo.password);
            expect(result).toEqual(user);
        });

        it('should return null if credentials are invalid', async () => {
            mockUserService.findUserByEmail.mockResolvedValue(null);
            bcrypt.compare.mockResolvedValue(false);

            const result = await authService.validateUser(loginInfo.email, loginInfo.password);

            expect(result).toBeNull();
        });

        it('should throw UnauthorizedException if user is not found', async () => {

            mockUserService.findUserByEmail.mockResolvedValue(null);

            expect(authService.validateUser(loginInfo.email, loginInfo.password));
        });

        it('should throw UnauthorizedException if password is incorrect', async () => {
            const user = new User();
            user.password = 'hashedPassword';

            mockUserService.findUserByEmail.mockResolvedValue(user);
            bcrypt.compare.mockResolvedValue(false);

            expect(authService.validateUser(loginInfo.email, user.password));
        });
    });

    describe('validateCredentials', () => {
        it('should return user if credentials are valid', async () => {
            const user = new User();
            user.password = loginInfo.password;

            mockUserService.findUserByEmail.mockResolvedValue(user);
            bcrypt.compare.mockResolvedValue(true);

            const result = await authService.validateCredentials(loginInfo.email, loginInfo.password);

            expect(result).toEqual(user);
        });

        it('should throw UnauthorizedException if credentials are invalid', async () => {
            mockUserService.findUserByEmail.mockResolvedValue(null);
            bcrypt.compare.mockResolvedValue(false);

            await expect(authService.validateCredentials(loginInfo.email, loginInfo.password))
                .rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException if user is not found', async () => {
            mockUserService.findUserByEmail.mockResolvedValue(null);
            bcrypt.compare.mockResolvedValue(false);

            await expect(authService.validateCredentials(loginInfo.email, loginInfo.password))
                .rejects.toThrow(UnauthorizedException);
        });

    });

    describe('login', () => {
        it('should return token if credentials are valid', async () => {
            const user = new User();
            user.password = loginInfo.password;

            mockUserService.findUserByEmail.mockResolvedValue(user);
            bcrypt.compare.mockResolvedValue(true);

            mockAuthRepository.create.mockResolvedValue(new Login());

            const result = await authService.login(loginInfo);

            expect(result).toEqual(token);
        });

        it('should throw UnauthorizedException if credentials are invalid', async () => {
            mockUserService.findUserByEmail.mockResolvedValue(null);
            bcrypt.compare.mockResolvedValue(false);

            await expect(authService.login(loginInfo)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException if user is not found', async () => {
            mockUserService.findUserByEmail.mockResolvedValue(null);

            await expect(authService.login(loginInfo)).rejects.toThrow(UnauthorizedException);
        });
    });


});