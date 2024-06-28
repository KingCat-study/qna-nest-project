import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginRequestDto } from './dtos/login-request.dto';
import { UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './guards/auth.guard';
import { Reflector } from '@nestjs/core';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;
  let authGuard: AuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            logout: jest.fn(),
            validateToken: jest.fn(),
          },
        },
        AuthGuard,
        Reflector,
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    authGuard = module.get<AuthGuard>(AuthGuard);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('login', () => {
    it('should return a token', async () => {
      const loginRequestDto: LoginRequestDto = { email: 'test@example.com', password: 'password' };
      const token = 'randomToken';

      jest.spyOn(authService, 'login').mockResolvedValue(token);

      const result = await authController.login(loginRequestDto, { setHeader: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn() } as any);

      expect(result).toBeUndefined();
      expect(authService.login).toHaveBeenCalledWith(loginRequestDto);
    });
  });

  describe('logout', () => {
    it('should call authService.logout if authenticated', async () => {
      const token = 'Bearer token';
      jest.spyOn(authGuard, 'canActivate').mockResolvedValue(true);
      const logoutSpy = jest.spyOn(authService, 'logout').mockResolvedValue();

      await authController.logout(token);

      expect(logoutSpy).toHaveBeenCalledWith(token);
    });

    it('should throw UnauthorizedException if token is missing', async () => {
      const token = '';

      jest.spyOn(authGuard, 'canActivate').mockImplementation(async () => {
        throw new UnauthorizedException('Token is missing');
      });

      try {
        await authController.logout(token);
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
      }
    });
  });

  describe('validate', () => {
    it('should return user data if token is valid', async () => {
      const token = 'Bearer token';
      const user = { id: '1', email: 'test@example.com' };

      jest.spyOn(authGuard, 'canActivate').mockResolvedValue(true);
      jest.spyOn(authService, 'validateToken').mockResolvedValue(user);

      const result = await authController.validate(token);

      expect(result).toEqual(user);
      expect(authService.validateToken).toHaveBeenCalledWith(token);
    });

    it('should throw UnauthorizedException if token is missing', async () => {
      const token = '';

      jest.spyOn(authGuard, 'canActivate').mockImplementation(async () => {
        throw new UnauthorizedException('Token is missing');
      });

      try {
        await authController.validate(token);
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
      }
    });
  });
});