import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dtos/create-request.dto';
import { CreateUserResponseDto } from './dtos/create-response.dto';
import { toCreateUserResponseDto, toFindAllUsersResponseDto } from './dtos/dto.mapper';
import { FindAllUsersResponseDto } from './dtos/find-all-response.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: EntityRepository<User>,
        private readonly em: EntityManager,
    ) { }

    async createUser(createUserDto: CreateUserDto): Promise<CreateUserResponseDto> {
        const { name, email, password } = createUserDto;
        await this.ensureUniqueEmail(email);

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = this.userRepository.create({ name, email, password: hashedPassword });
        await this.em.persistAndFlush(user);
        
        return toCreateUserResponseDto(user);
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

    async findAllUser(): Promise<FindAllUsersResponseDto[]> {
        const users = await this.userRepository.findAll();
        return users.map(user => toFindAllUsersResponseDto(user));
    }

    async deleteUser(id: string): Promise<void> {
        const user = await this.userRepository.findOneOrFail(id);
        await this.em.removeAndFlush(user)
    }
}
