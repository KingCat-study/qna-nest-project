import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dtos/create-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: EntityRepository<User>,
        private readonly em: EntityManager,
    ) { }

    async createUser(createUserDto: CreateUserDto): Promise<User> {
        const { name, email, password } = createUserDto;
        await this.ensureUniqueEmail(email);

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = this.userRepository.create({ name, email, password: hashedPassword });
        await this.em.persistAndFlush(user);
        
        return user;
    }

    async findUserByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({ email });
    }

    async ensureUniqueEmail(email: string): Promise<void> {
        const exsitingUser = await this.findUserByEmail(email);
        if (exsitingUser) {
            throw new BadRequestException('Email already in use');
        }
    }
}
