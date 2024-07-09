import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { ExtendedEntityRepository } from '../../common/repositories/extended-entity-repository';
import { UserService } from '../user/user.service';
import { LoginRequestDto } from './dtos/login-request.dto';
import { Login } from './entities/login.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(Login)
        private readonly authRepository: ExtendedEntityRepository<Login>,
        private readonly userService: UserService,
    ) {}

    async validateUser(email: string, plainPassword: string): Promise<User | null> {
        const user = await this.userService.findUserByEmail(email);
        if (!user) {
            return null;
        }
        
        try {
            const isPasswordValid = await bcrypt.compare(plainPassword, user.password);
            if (!isPasswordValid) {
                return null; 
            } 
        } catch (error) {
            console.error('비밀번호 검증 중 에러 발생:', error);
        }

        return user;
    }

    async validateCredentials(email: string, password: string): Promise<User> {
        const user = await this.validateUser(email, password);
        if (!user) {
            throw new UnauthorizedException('Email or password is incorrect');
        }
        return user;
    }

    async login(loginRequestDto: LoginRequestDto) {
        const { email, password } = loginRequestDto;
        const user = await this.validateCredentials(email, password);

        const token = randomBytes(32).toString('hex');
        const login = new Login();
        login.token = token;
        login.user = user; 

        await this.authRepository.persistAndFlush(login);

        return token;
    }

    async logout(token: string) {
        const login = await this.authRepository.findOne({ token });
        if (login) {
            await this.authRepository.removeAndFlush(login);
        }
    }

    async validateToken(token: string): Promise<any> {
        const login = await this.authRepository.findOne({ token }, { populate: ['user'] });
        if (!login) {
            throw new UnauthorizedException('Invalid token');
        }
        return login.user;
    }
}
