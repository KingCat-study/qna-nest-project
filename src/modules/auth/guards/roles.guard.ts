// src/auth/guards/roles.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../auth.service';
import { UserRole } from '../../user/entities/user-role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<UserRole[]>('roles', context.getHandler());
    if (!roles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization;

    if (!token) {
      throw new UnauthorizedException('Token is missing');
    }

    const user = await this.authService.validateBearerToken(token);
    if (!user || !roles.includes(UserRole.ADMIN)) {
      throw new UnauthorizedException('You do not have the necessary permissions');
    }

    request.user = user;
    return true;
  }
}