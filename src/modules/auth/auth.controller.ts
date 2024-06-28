import { Body, Controller, Get, Headers, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginRequestDto } from './dtos/login-request.dto';
import { AuthGuard } from './guards/auth.guard';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ) {}

    @Post('login')
    async login(@Body() loginRequestDto: LoginRequestDto,
                @Res() res: Response) {
        const token = await this.authService.login(loginRequestDto);
        res.setHeader('Authorization', `Bearer ${token}`);
        res.status(HttpStatus.OK).json({ message : 'Login successful'});
    }

    @Post('logout')
    @UseGuards(AuthGuard)
    async logout(@Headers('Authorization') token: string) {
        await this.authService.logout(token);
    }

    @Get('validate')
    @UseGuards(AuthGuard)
    async validate(@Headers('Authorization') token: string) {
        return this.authService.validateToken(token);
    }
}
