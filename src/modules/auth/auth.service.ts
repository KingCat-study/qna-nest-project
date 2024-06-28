import { EntityManager } from '@mikro-orm/sqlite';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { UserService } from '../user/user.service';
import { LoginRequestDto } from './dtos/login-request.dto';
import { Login } from './entities/login.entity';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly em: EntityManager
    ) {}

    async validateUser(email: string, password: string): Promise<any> {
        const user = await this.userService.findUserByEmail(email);
        if (user && await bcrypt.compare(password, user.password)) {
            return user;
        }
        return null;
    }

    async validateCredentials(email: string, password: string): Promise<any> {
        const user = await this.validateUser(email, password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
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

        await this.em.persistAndFlush(login);

        return token;
    }

    async logout(token: string) {
        const login = await this.em.findOne(Login, { token });
        if (login) {
            await this.em.removeAndFlush(login);
        }
    }

    async validateToken(token: string): Promise<any> {
        const login = await this.em.findOne(Login, { token }, { populate: ['user'] });
        if (!login) {
            throw new UnauthorizedException('Invalid token');
        }
        return login.user;
    }
}
