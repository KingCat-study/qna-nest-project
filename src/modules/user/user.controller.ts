import { Body, Controller, Post } from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';
import { User } from './entities/user.entity';
import { UserService } from './user.service';


@Controller('user')
export class UserController {
    constructor(
        private readonly userService: UserService
    ){}

    @Post('register')
    async register(@Body() createUserDto: CreateUserDto): Promise<User>{
        return this.userService.createUser(createUserDto);
    }
}
