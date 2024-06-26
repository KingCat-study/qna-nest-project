import { CreateUserResponseDto } from '../dtos/create-response.dto';
import { FindAllUsersResponseDto } from '../dtos/find-all-response.dto';
import { User } from '../entities/user.entity';

export function toCreateUserResponseDto(user: User): CreateUserResponseDto {
    return {
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}

export function toFindAllUsersResponseDto(user: User): FindAllUsersResponseDto {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}