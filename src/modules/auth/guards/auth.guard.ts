import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
                private readonly authService: AuthService, 
                private readonly reflector: Reflector
            ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['authorization'];

    if (!token) {
      console.log('AuthGuard Token is missing');
      throw new UnauthorizedException('Token is missing');
    }

    try {
      const user = await this.authService.validateBearerToken(token);
      request.user = user;
      return true;
    } catch (error) {
      console.log('AuthGuard Invalid token');
      console.log(error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}