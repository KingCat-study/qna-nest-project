import { Controller, Post, Body, Patch, Delete, Param, UseGuards, Get } from '@nestjs/common';
import { AnswerService } from './answer.service';
import { CreateAnswerDto } from './dtos/create-answer.dto';
import { UpdateAnswerDto } from './dtos/update-answer.dto';
import { AnswerResponseDto } from './dtos/answer-response.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/set-roles.decorator';
import { UserRole } from '../user/entities/user-role.enum';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../user/entities/user.entity';

@Controller('answers')
export class AnswerController {
    constructor(private readonly answerService: AnswerService) { }

    @Post()
    @UseGuards(AuthGuard)
    async createAnswer(
        @Body() createAnswerDto: CreateAnswerDto,
        @GetUser() user: User,
    ): Promise<AnswerResponseDto> {
        return this.answerService.createAnswer(createAnswerDto, user);
    }

    @Patch(':id')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.USER, UserRole.ADMIN)
    async updateAnswer(
        @Body() updateAnswerDto: UpdateAnswerDto,
        @GetUser() user: User,
    ): Promise<AnswerResponseDto> {
        return this.answerService.updateAnswer(updateAnswerDto, user);
    }

    @Delete(':id')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.USER, UserRole.ADMIN)
    async deleteAnswer(
        @Param('id') id: string, 
        @GetUser() user: User
    ): Promise<void> {
        return this.answerService.deleteAnswer(id, user);
    }

    @Get(':questionId')
    async findAllAnswersByQuestion(
        @Param('questionId') questionId: string)
        : Promise<AnswerResponseDto[]> {
        return this.answerService.findAllAnswersByQuestion(questionId);
    }
}