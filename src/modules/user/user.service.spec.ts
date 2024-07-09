import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dtos/create-request.dto';
import { toCreateUserResponseDto } from './dtos/dto.mapper';
import { UserRole } from './entities/user-role.enum';
import { User } from './entities/user.entity';
import { UserService } from './user.service';
import { BadRequestException } from '@nestjs/common';

jest.mock('bcrypt');

describe('UserService', () => {
    let userService: UserService;
    let mockUserRepository;

    const mockUser: User = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        mockUserRepository = {
            create: jest.fn(),
            persistAndFlush: jest.fn(),
            findOne: jest.fn(),
            findAll: jest.fn(),
            findOneOrFail: jest.fn(),
            removeAndFlush: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                { provide: getRepositoryToken(User), useValue: mockUserRepository },
            ],
        }).compile();

        userService = module.get<UserService>(UserService);
    });

    it('should be defined', () => {
        expect(userService).toBeDefined();
    });

    describe('createUser', () => {
        it('should create a new user', async () => {
            const createUserDto: CreateUserDto = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                role: UserRole.USER,
            };

            const hashedPassword = 'hashedPassword';
            bcrypt.hash.mockResolvedValue(hashedPassword);
            mockUserRepository.create.mockReturnValue(mockUser);
            jest.spyOn(userService, 'ensureUniqueEmail').mockResolvedValue();

            const result = await userService.createUser(createUserDto);

            expect(userService.ensureUniqueEmail).toHaveBeenCalledWith(createUserDto.email);
            expect(mockUserRepository.create).toHaveBeenCalledWith({
                ...createUserDto,
                password: hashedPassword,
            });
            expect(mockUserRepository.persistAndFlush).toHaveBeenCalledWith(mockUser);
            expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
            expect(result).toEqual(toCreateUserResponseDto(mockUser));
        });

        it('should throw an error if email is already in use', async () => {
            const createUserDto: CreateUserDto = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                role: UserRole.USER,
            }

            jest.spyOn(userService, 'ensureUniqueEmail').mockRejectedValue(new BadRequestException('Email already in use'));
            await expect(userService.createUser(createUserDto)).rejects.toThrow(new BadRequestException('Email already in use'));
        });
    });

    describe('ensureUniqueEmail', () => {
        it('should throw an error if email is already in use', async () => {
            mockUserRepository.findOne.mockResolvedValue(mockUser);

            await expect(userService.ensureUniqueEmail(mockUser.email)).rejects.toThrow(new BadRequestException('Email already in use'));
        });

        it('should not throw an error if email is not in use', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);

            await expect(userService.ensureUniqueEmail(mockUser.email)).resolves.not.toThrow();
        });
    });

    describe('findAllUser', () => {
        it('should return all users', async () => {
            mockUserRepository.findAll.mockResolvedValue([mockUser]);

            const result = await userService.findAllUser();
            console.log(result);

            expect(mockUserRepository.findAll).toHaveBeenCalled();
            expect(result).toEqual([
                {
                id: mockUser.id,
                name: mockUser.name,
                email: mockUser.email,
                role: mockUser.role,
                createdAt: mockUser.createdAt,
                updatedAt: mockUser.updatedAt,
                },
            ]);
        });

        it('should return an empty array if no users are found', async () => {
            mockUserRepository.findAll.mockResolvedValue([]);

            const result = await userService.findAllUser();

            expect(mockUserRepository.findAll).toHaveBeenCalled();
            expect(result).toEqual([]);
        });
    });

    describe('deleteUser', () => {
        it('should delete a user', async () => {
            mockUserRepository.findOneOrFail.mockResolvedValue(mockUser);

            await userService.deleteUser(mockUser.id);

            expect(mockUserRepository.findOneOrFail).toHaveBeenCalledWith(mockUser.id);
            expect(mockUserRepository.removeAndFlush).toHaveBeenCalledWith(mockUser);
        });

        it('should throw an error if user is not found', async () => {
            mockUserRepository.findOneOrFail.mockRejectedValue(new Error('User not found'));

            await expect(userService.deleteUser(mockUser.id)).rejects.toThrow(new Error('User not found'));
        });
    });

});