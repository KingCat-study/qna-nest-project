import { Module, forwardRef } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { ExtendedEntityRepository } from 'src/common/repositories/extended-entity-repository';

@Module({
  imports: [
    forwardRef(() => UserModule),
  ],
  providers: [
    AuthService, 
    AuthGuard, 
    RolesGuard,
    { provide: 'entityRepository', useClass: ExtendedEntityRepository },
  ],
  exports: [AuthService],
})
export class AuthModule {}
