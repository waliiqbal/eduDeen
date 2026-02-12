import {
    Controller,
    Post,
    Get,
    Body,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { User } from './decorators/user.decorator';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('refresh-token')
    @UseGuards(JwtRefreshGuard)
    refreshToken(@User('_id') userId: string) {
        return this.authService.refreshToken(userId);
    }

    @Post('register')
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Post('login')
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('me')
    getMe(@User('_id') userId: string) {
        return this.authService.getMe(userId);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post('logout')
    logout(@Req() req) {
        return this.authService.logout(req.headers.authorization);
    }

    @Get('oauth/success')
    oauthSuccess(@Req() req) {
        return this.authService.oauthSuccess(req.user);
    }

    @Get('oauth/failure')
    oauthFailure() {
        return {
            success: false,
            message: 'OAuth authentication failed',
        };
    }

    // OAuth providers
    @Get('google')
    @UseGuards(AuthGuard('google'))
    google() { }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    googleCb(@Req() req) {
        return this.authService.oauthSuccess(req.user);
    }
}