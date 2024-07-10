import { Module, forwardRef } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { ExtendedEntityRepository } from '../../common/repositories/extended-entity-repository';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Login } from './entities/login.entity';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    forwardRef(() => UserModule),
    MikroOrmModule.forFeature([Login]),
  ],
  providers: [
    AuthService, 
    AuthGuard, 
    RolesGuard,
    { provide: 'entityRepository', useClass: ExtendedEntityRepository },
  ],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
