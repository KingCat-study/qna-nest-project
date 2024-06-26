import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dtos/create-user.dto';
import * as bcrypt from 'bcrypt';
import { BadRequestException } from '@nestjs/common';

describe('UserService', () => {
  let userService: UserService;
  let userRepository: EntityRepository<User>;
  let entityManager: EntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useClass: EntityRepository,
        },
        {
          provide: EntityManager,
          useValue: {
            persistAndFlush: jest.fn(),
          },
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    userRepository = module.get<EntityRepository<User>>(getRepositoryToken(User));
    entityManager = module.get<EntityManager>(EntityManager);
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password123',
      };

      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValueOnce(hashedPassword);
      jest.spyOn(userRepository, 'create').mockReturnValue({
        id: '1',
        name: createUserDto.name,
        email: createUserDto.email,
        password: hashedPassword,
      } as User);
      jest.spyOn(entityManager, 'persistAndFlush').mockResolvedValueOnce();

      const user = await userService.createUser(createUserDto);

      expect(user).toEqual({
        id: '1',
        name: createUserDto.name,
        email: createUserDto.email,
        password: hashedPassword,
      });
      expect(userRepository.findOne).toHaveBeenCalledWith({ email: createUserDto.email });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(userRepository.create).toHaveBeenCalledWith({
        name: createUserDto.name,
        email: createUserDto.email,
        password: hashedPassword,
      });
      expect(entityManager.persistAndFlush).toHaveBeenCalledWith(user);
    });

    it('should throw an error if email is already in use', async () => {
      const createUserDto: CreateUserDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password123',
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(new User());

      await expect(userService.createUser(createUserDto)).rejects.toThrow(BadRequestException);
      expect(userRepository.findOne).toHaveBeenCalledWith({ email: createUserDto.email });
    });
  });

  describe('findUserByEmail', () => {
    it('should return a user if found', async () => {
      const email = 'john.doe@example.com';
      const user = new User();
      user.email = email;

      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(user);

      const result = await userService.findUserByEmail(email);

      expect(result).toEqual(user);
      expect(userRepository.findOne).toHaveBeenCalledWith({ email });
    });

    it('should return null if user is not found', async () => {
      const email = 'john.doe@example.com';

      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(null);

      const result = await userService.findUserByEmail(email);

      expect(result).toBeNull();
      expect(userRepository.findOne).toHaveBeenCalledWith({ email });
    });
  });

  describe('ensureUniqueEmail', () => {
    it('should throw an error if email is already in use', async () => {
      const email = 'john.doe@example.com';

      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(new User());

      await expect(userService.ensureUniqueEmail(email)).rejects.toThrow(BadRequestException);
      expect(userRepository.findOne).toHaveBeenCalledWith({ email });
    });

    it('should not throw an error if email is not in use', async () => {
      const email = 'john.doe@example.com';

      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(null);

      await expect(userService.ensureUniqueEmail(email)).resolves.toBeUndefined();
      expect(userRepository.findOne).toHaveBeenCalledWith({ email });
    });
  });
});