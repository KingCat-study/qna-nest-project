import { Module, forwardRef } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    forwardRef(() => UserModule),
  ],
  providers: [AuthService, AuthGuard, RolesGuard],
  exports: [AuthService],
})
export class AuthModule {}
