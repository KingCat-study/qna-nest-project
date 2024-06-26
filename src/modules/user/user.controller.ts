import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CreateUserDto } from './dtos/create-request.dto';
import { CreateUserResponseDto } from './dtos/create-response.dto';
import { FindAllUsersResponseDto } from './dtos/find-all-response.dto';
import { UserService } from './user.service';


@Controller('user')
export class UserController {
    constructor(
        private readonly userService: UserService
    ){}

    @Post()
    async register(@Body() createUserDto: CreateUserDto): Promise<CreateUserResponseDto>{
        return this.userService.createUser(createUserDto);
    }

    @Delete(':id')
    async deleteUser(@Param('id') id: string): Promise<void>{
        return this.userService.deleteUser(id);
    }

    @Get()
    async findAll(): Promise<FindAllUsersResponseDto[]> {
      return this.userService.findAllUser();
    }
}
