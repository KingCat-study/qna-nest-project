import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dtos/create-request.dto';
import { toCreateUserResponseDto, toFindAllUsersResponseDto } from './dtos/dto.mapper';
import { UserRole } from './entities/user-role.enum';
import { User } from './entities/user.entity';
import { UserService } from './user.service';

jest.mock('bcrypt');

describe('UserService', () => {
  let userService: UserService;
  let userRepository: EntityRepository<User>;
  let em: EntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            findOneOrFail: jest.fn(),
            findAll: jest.fn(),
            persistAndFlush: jest.fn(),
            removeAndFlush: jest.fn(),
          },
        },
        {
          provide: EntityManager,
          useValue: {
            persistAndFlush: jest.fn(),
            removeAndFlush: jest.fn(),
          },
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    userRepository = module.get<EntityRepository<User>>(getRepositoryToken(User));
    em = module.get<EntityManager>(EntityManager);
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = { name: 'John Doe', email: 'john.doe@example.com', password: 'password', role: UserRole.USER };
      const hashedPassword = 'hashedPassword'; // 모킹된 해시 비밀번호
      const user = new User();
      user.id = '1';
      user.name = createUserDto.name;
      user.email = createUserDto.email;
      user.password = hashedPassword;
      user.role = createUserDto.role;
      user.createdAt = new Date();
      user.updatedAt = new Date();

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      jest.spyOn(userRepository, 'create').mockReturnValue(user);
      jest.spyOn(em, 'persistAndFlush').mockResolvedValue();
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      const result = await userService.createUser(createUserDto);

      expect(result).toEqual(toCreateUserResponseDto(user));
      expect(userRepository.create).toHaveBeenCalledWith({ name: createUserDto.name, email: createUserDto.email, password: hashedPassword, role: createUserDto.role });
      expect(em.persistAndFlush).toHaveBeenCalledWith(user);
    });

    it('should throw BadRequestException if email is already in use', async () => {
      const createUserDto: CreateUserDto = { name: 'John Doe', email: 'john.doe@example.com', password: 'password', role: UserRole.USER };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(new User());

      await expect(userService.createUser(createUserDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findUserByEmail', () => {
    it('should return a user if found', async () => {
      const user = new User();
      user.email = 'john.doe@example.com';

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);

      const result = await userService.findUserByEmail('john.doe@example.com');

      expect(result).toEqual(user);
      expect(userRepository.findOne).toHaveBeenCalledWith({ email: 'john.doe@example.com' });
    });

    it('should return null if user is not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      const result = await userService.findUserByEmail('john.doe@example.com');

      expect(result).toBeNull();
      expect(userRepository.findOne).toHaveBeenCalledWith({ email: 'john.doe@example.com' });
    });
  });

  describe('deleteUser', () => {
    it('should delete a user by id', async () => {
      const user = new User();
      user.id = '1';

      jest.spyOn(userRepository, 'findOneOrFail').mockResolvedValue(user);
      jest.spyOn(em, 'removeAndFlush').mockResolvedValue();

      await userService.deleteUser('1');

      expect(userRepository.findOneOrFail).toHaveBeenCalledWith('1');
      expect(em.removeAndFlush).toHaveBeenCalledWith(user);
    });
  });

  describe('findAllUser', () => {
    it('should return an array of users', async () => {
      const user1 = new User();
      user1.id = '1';
      user1.name = 'John Doe';
      user1.email = 'john.doe@example.com';
      user1.role = UserRole.USER;
      user1.createdAt = new Date();
      user1.updatedAt = new Date();

      const user2 = new User();
      user2.id = '2';
      user2.name = 'Jane Doe';
      user2.email = 'jane.doe@example.com';
      user2.role = UserRole.USER;
      user2.createdAt = new Date();
      user2.updatedAt = new Date();

      jest.spyOn(userRepository, 'findAll').mockResolvedValue([user1, user2]);

      const result = await userService.findAllUser();

      expect(result).toEqual([toFindAllUsersResponseDto(user1), toFindAllUsersResponseDto(user2)]);
      expect(userRepository.findAll).toHaveBeenCalled();
    });
  });
});