import {
    Controller,
    Post,
    Get,
    Body,
    Req,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { User } from './decorators/user.decorator';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
    VerifyEmailDto,
    ResendVerificationDto,
    ForgotPasswordDto,
    ResetPasswordDto,
} from './dto/verify-email.dto';
import { SocialLoginDto } from './dto/social-login.dto';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    // ============================================================
    // REGISTRATION & EMAIL VERIFICATION
    // ============================================================

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Register new user (sends OTP to email)' })
    @ApiResponse({
        status: 201,
        description: 'User registered successfully, OTP sent to email',
    })
    @ApiResponse({ status: 400, description: 'Email already exists' })
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Post('verify-email')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verify email with OTP code' })
    @ApiResponse({
        status: 200,
        description: 'Email verified successfully, returns user and tokens',
    })
    @ApiResponse({ status: 401, description: 'Invalid OTP' })
    @ApiResponse({ status: 404, description: 'User not found' })
    verifyEmail(@Body() dto: VerifyEmailDto) {
        return this.authService.verifyEmail(dto.email, dto.otp);
    }

    @Post('resend-verification')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Resend email verification OTP' })
    @ApiResponse({ status: 200, description: 'OTP resent successfully' })
    @ApiResponse({
        status: 400,
        description: 'Email already verified or too many requests',
    })
    @ApiResponse({ status: 404, description: 'User not found' })
    resendVerification(@Body() dto: ResendVerificationDto) {
        return this.authService.resendVerificationOtp(dto.email);
    }

    // ============================================================
    // LOGIN & TOKENS
    // ============================================================

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login user (requires verified email)' })
    @ApiResponse({ status: 200, description: 'Login successful, returns tokens' })
    @ApiResponse({
        status: 401,
        description: 'Invalid credentials or email not verified',
    })
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Post('refresh-token')
    @UseGuards(JwtRefreshGuard)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh access token' })
    @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
    @ApiResponse({ status: 401, description: 'Invalid refresh token' })
    refreshToken(@User('_id') userId: string) {
        return this.authService.refreshToken(userId);
    }

    // ============================================================
    // PASSWORD RESET
    // ============================================================

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Send password reset OTP to email' })
    @ApiResponse({ status: 200, description: 'Password reset OTP sent to email' })
    forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto.email);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Reset password with OTP code' })
    @ApiResponse({
        status: 200,
        description: 'Password reset successful, can now login with new password',
    })
    @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
    @ApiResponse({ status: 404, description: 'User not found' })
    resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(
            dto.email,
            dto.otp,
            dto.newPassword,
        );
    }

    // ============================================================
    // USER PROFILE
    // ============================================================

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('me')
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    getMe(@User('_id') userId: string) {
        return this.authService.getMe(userId);
    }

    // ============================================================
    // LOGOUT
    // ============================================================

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Logout user (blacklist token)' })
    @ApiResponse({ status: 200, description: 'Logout successful' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    logout(@Req() req) {
        return this.authService.logout(req.headers.authorization);
    }

    // ============================================================
    // OAUTH
    // ============================================================

    @Get('oauth/success')
    @ApiOperation({ summary: 'OAuth success callback' })
    oauthSuccess(@Req() req) {
        return this.authService.oauthSuccess(req.user);
    }

    @Get('oauth/failure')
    @ApiOperation({ summary: 'OAuth failure callback' })
    oauthFailure() {
        return {
            success: false,
            message: 'OAuth authentication failed',
        };
    }

    // Google OAuth
    @Get('google')
    @UseGuards(AuthGuard('google'))
    @ApiOperation({ summary: 'Initiate Google OAuth' })
    google() {
        // Initiates Google OAuth flow
    }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    @ApiOperation({ summary: 'Google OAuth callback' })
    googleCb(@Req() req) {
        return this.authService.oauthSuccess(req.user);
    }

    // Add this endpoint to your AuthController class

    // ============================================================
    // SOCIAL LOGIN (Google, Facebook, Apple)
    // ============================================================

    @Post('social-login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Login via social providers (Google, Facebook, Apple)',
        description: 'Unified endpoint for all social logins. Creates account if new, logs in if existing.',
    })
    @ApiResponse({
        status: 200,
        description: 'Social login successful',
        schema: {
            example: {
                success: true,
                message: 'google login successful',
                data: {
                    user: {
                        id: '...',
                        name: 'John Doe',
                        email: 'john@example.com',
                        profileImage: 'https://...',
                        isEmailVerified: true,
                    },
                    token: {
                        accessToken: '...',
                        refreshToken: '...',
                    },
                },
            },
        },
    })
    @ApiResponse({
        status: 401,
        description: 'Email already registered with password or account deactivated',
    })
    @ApiResponse({ status: 400, description: 'Invalid data or missing socialId' })
    socialLogin(@Body() dto: SocialLoginDto) {
        return this.authService.socialLogin({
            authProvider: dto.authProvider,
            token: dto.token,
            userName: dto.userName,
            email: dto.email,
            socialId: dto.socialId,
            image: dto.image,
            fcmToken: dto.fcmToken,
        });
    }
}