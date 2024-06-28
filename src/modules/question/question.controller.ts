import { Controller, Post, Body, Get, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { QuestionService } from './question.service';
import { CreateQuestionDto } from './dtos/create-question.dto';
import { UpdateQuestionDto } from './dtos/update-question.dto';
import { QuestionResponseDto } from './dtos/question-response.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/set-roles.decorator';
import { UserRole } from '../user/entities/user-role.enum';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../user/entities/user.entity';

@Controller('questions')
export class QuestionController {
    constructor(private readonly questionService: QuestionService) { }

    @Post()
    @UseGuards(AuthGuard)
    async createQuestion(
        @Body() createQuestionDto: CreateQuestionDto,
        @GetUser() user: User,
    ): Promise<QuestionResponseDto> {
        return this.questionService.createQuestion(createQuestionDto, user);
    }

    @Patch()
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.USER)
    async updateQuestion(
        @Body() updateQuestionDto: UpdateQuestionDto,
        @GetUser() user: User,
    ): Promise<QuestionResponseDto> {
        return this.questionService.updateQuestion(updateQuestionDto, user);
    }

    @Delete(':id')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.USER)
    async deleteQuestion(@Param('id') id: string, @GetUser() user: User): Promise<void> {
        return this.questionService.deleteQuestion(id, user);
    }

    @Get()
    async findAll(): Promise<QuestionResponseDto[]> {
        return this.questionService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<QuestionResponseDto> {
        return this.questionService.findOne(id);
    }
}