// src/user/user.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto } from './dtos/create-request.dto';
import { CreateUserResponseDto } from './dtos/create-response.dto';
import { FindAllUsersResponseDto } from './dtos/find-all-response.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../auth/auth.service';
import { UserRole } from './entities/user-role.enum';

describe('UserController', () => {
  let userController: UserController;
  let userService: UserService;
  let authGuard: AuthGuard;
  let rolesGuard: RolesGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            createUser: jest.fn(),
            deleteUser: jest.fn(),
            findAllUser: jest.fn(),
          },
        },
        AuthGuard,
        RolesGuard,
        Reflector,
        {
          provide: AuthService,
          useValue: {
            validateToken: jest.fn(),
          },
        },
      ],
    }).compile();

    userController = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
    authGuard = module.get<AuthGuard>(AuthGuard);
    rolesGuard = module.get<RolesGuard>(RolesGuard);
  });

  it('should be defined', () => {
    expect(userController).toBeDefined();
  });

  describe('register', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = { name: 'John Doe', email: 'john.doe@example.com', password: 'password', role: UserRole.USER };
      const createUserResponseDto: CreateUserResponseDto = { name: 'John Doe', email: 'john.doe@example.com', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() };

      jest.spyOn(userService, 'createUser').mockResolvedValue(createUserResponseDto);

      const result = await userController.register(createUserDto);

      expect(result).toEqual(createUserResponseDto);
      expect(userService.createUser).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('deleteUser', () => {
    it('should delete a user by id if authenticated and authorized', async () => {
      const id = '1';

      jest.spyOn(authGuard, 'canActivate').mockResolvedValue(true);
      jest.spyOn(rolesGuard, 'canActivate').mockResolvedValue(true);
      const deleteUserSpy = jest.spyOn(userService, 'deleteUser').mockResolvedValue();

      const context: ExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { authorization: 'Bearer token' },
          }),
        }),
      } as ExecutionContext;

      expect(await authGuard.canActivate(context)).toBe(true);
      expect(await rolesGuard.canActivate(context)).toBe(true);
      await userController.deleteUser(id);

      expect(deleteUserSpy).toHaveBeenCalledWith(id);
    });

    it('should throw UnauthorizedException if token is missing', async () => {
      const id = '1';

      jest.spyOn(authGuard, 'canActivate').mockImplementation(async () => {
        throw new UnauthorizedException('Token is missing');
      });

      const context: ExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {},
          }),
        }),
      } as ExecutionContext;

      try {
        await authGuard.canActivate(context);
        await userController.deleteUser(id);
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
      }
    });
  });

  describe('findAll', () => {
    it('should return an array of users if authenticated and authorized', async () => {
      const findAllUsersResponseDto: FindAllUsersResponseDto[] = [
        { id: '1', name: 'John Doe', email: 'john.doe@example.com', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() },
        { id: '2', name: 'Jane Doe', email: 'jane.doe@example.com', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() },
      ];

      jest.spyOn(authGuard, 'canActivate').mockResolvedValue(true);
      jest.spyOn(rolesGuard, 'canActivate').mockResolvedValue(true);
      jest.spyOn(userService, 'findAllUser').mockResolvedValue(findAllUsersResponseDto);

      const context: ExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { authorization: 'Bearer token' },
          }),
        }),
      } as ExecutionContext;

      expect(await authGuard.canActivate(context)).toBe(true);
      expect(await rolesGuard.canActivate(context)).toBe(true);
      const result = await userController.findAll();

      expect(result).toEqual(findAllUsersResponseDto);
      expect(userService.findAllUser).toHaveBeenCalled();
    });
  });
});

   