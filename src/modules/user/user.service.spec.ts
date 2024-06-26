import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dtos/create-request.dto';
import * as bcrypt from 'bcrypt';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateUserResponseDto } from './dtos/create-response.dto';

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
            removeAndFlush: jest.fn(),
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
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User);
      jest.spyOn(entityManager, 'persistAndFlush').mockResolvedValueOnce();

      const userResponse: CreateUserResponseDto = await userService.createUser(createUserDto);

      expect(userResponse).toEqual({
        name: createUserDto.name,
        email: createUserDto.email,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(userRepository.findOne).toHaveBeenCalledWith({ email: createUserDto.email });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(userRepository.create).toHaveBeenCalledWith({
        name: createUserDto.name,
        email: createUserDto.email,
        password: hashedPassword,
      });
      expect(entityManager.persistAndFlush).toHaveBeenCalledWith(expect.any(Object));
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
    it('should not throw an error if email is not in use', async () => {
      const email = 'john.doe@example.com';

      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(null);

      await expect(userService.ensureUniqueEmail(email)).resolves.toBeUndefined();
      expect(userRepository.findOne).toHaveBeenCalledWith({ email });
    });
  });

  describe('deleteUser', () => {
    it('should delete a user if found', async () => {
      const id = '1';
      const user = new User();
      user.id = id;

      jest.spyOn(userRepository, 'findOneOrFail').mockResolvedValueOnce(user);
      jest.spyOn(entityManager, 'removeAndFlush').mockResolvedValueOnce();

      await userService.deleteUser(id);

      expect(userRepository.findOneOrFail).toHaveBeenCalledWith(id);
      expect(entityManager.removeAndFlush).toHaveBeenCalledWith(user);
    });

    it('should throw an error if user is not found', async () => {
      const id = '1';

      jest.spyOn(userRepository, 'findOneOrFail').mockRejectedValueOnce(new NotFoundException('User not found'));

      await expect(userService.deleteUser(id)).rejects.toThrow(NotFoundException);
      expect(userRepository.findOneOrFail).toHaveBeenCalledWith(id);
    });
  });

  describe('findAllUsers', () => {
    it('should return an array of users', async () => {
      const users: User[] = [
        { id: '1', name: 'John Doe', email: 'john.doe@example.com', password: 'hashedPassword', createdAt: new Date(), updatedAt: new Date() } as User,
        { id: '2', name: 'Jane Doe', email: 'jane.doe@example.com', password: 'hashedPassword', createdAt: new Date(), updatedAt: new Date() } as User,
      ];

      jest.spyOn(userRepository, 'findAll').mockResolvedValueOnce(users);

      const result = await userService.findAllUser();

      expect(result).toEqual([
        {
          id: '1',
          name: 'John Doe',
          email: 'john.doe@example.com',
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
        {
          id: '2',
          name: 'Jane Doe',
          email: 'jane.doe@example.com',
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      ]);
      expect(userRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array if no users are found', async () => {
      jest.spyOn(userRepository, 'findAll').mockResolvedValueOnce([]);

      const result = await userService.findAllUser();

      expect(result).toEqual([]);
      expect(userRepository.findAll).toHaveBeenCalledTimes(1);
    });
  });

});