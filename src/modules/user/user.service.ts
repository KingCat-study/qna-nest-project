import { InjectRepository } from '@mikro-orm/nestjs';
import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ExtendedEntityRepository } from '../../common/repositories/extended-entity-repository';
import { CreateUserDto } from './dtos/create-request.dto';
import { CreateUserResponseDto } from './dtos/create-response.dto';
import { toCreateUserResponseDto, toFindAllUsersResponseDto } from './dtos/dto.mapper';
import { FindAllUsersResponseDto } from './dtos/find-all-response.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: ExtendedEntityRepository<User>,
    ) { }

    async createUser(createUserDto: CreateUserDto): Promise<CreateUserResponseDto> {
        const { name, email, password, role } = createUserDto;
        await this.ensureUniqueEmail(email);

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = this.userRepository.create({ name, email, password: hashedPassword, role });
        await this.userRepository.persistAndFlush(user);
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

    async findAllUser(email?: string): Promise<FindAllUsersResponseDto[]> {
        const searchCondition = email ? { email } : {};
        const users = await this.userRepository.find(searchCondition);
        return users.map(user => toFindAllUsersResponseDto(user));
    }

    async deleteUser(id: string): Promise<void> {
        const user = await this.userRepository.findOneOrFail(id);
        await this.userRepository.removeAndFlush(user)
    }
}
