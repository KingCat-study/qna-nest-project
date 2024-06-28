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
  let userService: UserService;
  let em: EntityManager;
  const token = Buffer.from('randomToken', 'utf8').toString('hex');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findUserByEmail: jest.fn(),
          },
        },
        {
          provide: EntityManager,
          useValue: {
            persistAndFlush: jest.fn(),
            findOne: jest.fn(),
            removeAndFlush: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    em = module.get<EntityManager>(EntityManager);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user data without password if credentials are valid', async () => {
      const user = new User();
      user.id = '1';
      user.email = 'test@example.com';
      user.password = 'hashedPassword';
      user.name = 'Test User';
      jest.spyOn(userService, 'findUserByEmail').mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.validateUser('test@example.com', 'password');

      expect(result).toEqual(user);
    });

    it('should return null if credentials are invalid', async () => {
      jest.spyOn(userService, 'findUserByEmail').mockResolvedValue(null);

      const result = await authService.validateUser('test@example.com', 'password');

      expect(result).toBeNull();
    });
  });

  describe('validateCredentials', () => {
    it('should throw UnauthorizedException if user is null', async () => {
      jest.spyOn(authService, 'validateUser').mockResolvedValue(null);

      await expect(authService.validateCredentials('test@example.com', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return user if credentials are valid', async () => {
      const user = new User();
      user.id = '1';
      user.email = 'test@example.com';
      user.password = 'hashedPassword';
      user.name = 'Test User';
      jest.spyOn(authService, 'validateUser').mockResolvedValue(user);

      const result = await authService.validateCredentials('test@example.com', 'password');

      expect(result).toEqual(user);
    });
  });

  describe('login', () => {
    it('should return a token if login is successful', async () => {
      const user = new User();
      user.id = '1';
      user.email = 'test@example.com';
      user.password = 'hashedPassword';
      user.name = 'Test User';
      jest.spyOn(authService, 'validateCredentials').mockResolvedValue(user);
      jest.spyOn(em, 'persistAndFlush').mockImplementation(async () => Promise.resolve());

      const result = await authService.login({ email: 'test@example.com', password: 'password' });

      expect(result).toEqual(token);
      expect(em.persistAndFlush).toHaveBeenCalledWith(expect.any(Login));
    });
  });

  describe('validateToken', () => {
    it('should return user if token is valid', async () => {
      const user = new User();
      user.id = '1';
      user.email = 'test@example.com';
      user.password = 'hashedPassword';
      user.name = 'Test User';
      const login = { token: 'randomToken', user } as Login;
      jest.spyOn(em, 'findOne').mockResolvedValue(login);

      const result = await authService.validateToken('randomToken');

      expect(result).toEqual(user);
    });

    it('should throw UnauthorizedException if token is invalid', async () => {
      jest.spyOn(em, 'findOne').mockResolvedValue(null);

      await expect(authService.validateToken('invalidToken')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should remove token if it exists', async () => {
      const login = { token: 'randomToken' } as Login;
      jest.spyOn(em, 'findOne').mockResolvedValue(login);
      jest.spyOn(em, 'removeAndFlush').mockImplementation(async () => Promise.resolve());

      await authService.logout('randomToken');

      expect(em.removeAndFlush).toHaveBeenCalledWith(login);
    });

    it('should do nothing if token does not exist', async () => {
      jest.spyOn(em, 'findOne').mockResolvedValue(null);
      jest.spyOn(em, 'removeAndFlush').mockImplementation(async () => Promise.resolve());

      await authService.logout('invalidToken');

      expect(em.removeAndFlush).not.toHaveBeenCalled();
    });
  });
});