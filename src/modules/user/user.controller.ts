import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CreateUserDto } from './dtos/create-request.dto';
import { CreateUserResponseDto } from './dtos/create-response.dto';
import { FindAllUsersResponseDto } from './dtos/find-all-response.dto';
import { UserService } from './user.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/set-roles.decorator';
import { UserRole } from './entities/user-role.enum';

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
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async deleteUser(@Param('id') id: string): Promise<void>{
        return this.userService.deleteUser(id);
    }

    @Get()
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async findAll(@Query('email') email?: string): Promise<FindAllUsersResponseDto[]> {
      return this.userService.findAllUser(email);
    }
}
