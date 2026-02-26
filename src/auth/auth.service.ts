import {
    Injectable,
    BadRequestException,
    UnauthorizedException,
    NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as jwt from 'jsonwebtoken';
import { User, UserDocument } from '../users/schemas/user.schema';
import { TokenBlacklist } from './schemas/token-blacklist.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { OtpService } from '../otp/otp.service';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name)
        private userModel: Model<UserDocument>,

        @InjectModel(TokenBlacklist.name)
        private blacklistModel: Model<TokenBlacklist>,

        private jwtService: JwtService,
        private otpService: OtpService,
    ) { }

    // ============================================================
    // TOKEN GENERATION
    // ============================================================

    generateTokens(user: User) {
        const payload = { _id: user._id, email: user.email };

        const accessToken = this.jwtService.sign(payload, {
            expiresIn: '7d',
        });

        const refreshToken = this.jwtService.sign(payload, {
            secret: process.env.JWT_REFRESH_SECRET,
            expiresIn: '7d',
        });

        return { accessToken, refreshToken };
    }

    async refreshToken(userId: string) {
        const user = await this.userModel.findById(userId);
        if (!user) throw new UnauthorizedException();

        return this.generateTokens(user);
    }

    async register(dto: RegisterDto) {
        try {
            const { name, email, password, phone, address } = dto;

            // Check if user already exists
            const userExists = await this.userModel.findOne({ email });
            if (userExists) {
                throw new BadRequestException(
                    'User already exists with this email',
                );
            }

            // Create user (password hashing happens in User schema pre-save hook)
            const user = await this.userModel.create({
                name,
                email,
                password,
                phone,
                address,
                isEmailVerified: false, // Not verified yet
            });

            // Send OTP for email verification
            await this.otpService.sendOtp({
                email: user.email,
                type: 'email_verification',
            });

            console.log(`✅ User registered: ${email}`);

            return {
                success: true,
                message:
                    'Registration successful. Please verify your email with the OTP sent.',
                data: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    isEmailVerified: user.isEmailVerified,
                },
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Error during registration');
        }
    }

    // ============================================================
    // VERIFY EMAIL WITH OTP
    // ============================================================

    async verifyEmail(email: string, otp: string) {
        try {
            // Find user
            const user = await this.userModel.findOne({ email }).exec();

            if (!user) {
                throw new NotFoundException('User not found');
            }

            // Check if already verified
            if (user.isEmailVerified) {
                return {
                    success: true,
                    message: 'Email already verified',
                    data: {
                        user: this.safeUser(user),
                        isEmailVerified: true,
                    },
                };
            }

            // Verify OTP
            const otpResult = await this.otpService.verifyOtp({
                email,
                otp,
                type: 'email_verification',
            });

            if (!otpResult.success) {
                throw new UnauthorizedException('Invalid OTP');
            }

            // Update user as verified
            user.isEmailVerified = true;
            user.emailVerifiedAt = new Date();
            await user.save();

            console.log(`✅ Email verified: ${email}`);

            // Generate tokens
            const tokens = this.generateTokens(user);

            return {
                success: true,
                message: 'Email verified successfully',
                data: {
                    user: this.safeUser(user),
                    token: tokens,
                },
            };
        } catch (error) {
            if (
                error instanceof NotFoundException ||
                error instanceof UnauthorizedException
            ) {
                throw error;
            }
            throw new BadRequestException('Error verifying email');
        }
    }

    // ============================================================
    // RESEND VERIFICATION OTP
    // ============================================================

    async resendVerificationOtp(email: string) {
        try {
            // Check if user exists
            const user = await this.userModel.findOne({ email }).exec();

            if (!user) {
                throw new NotFoundException('User not found');
            }

            // Check if already verified
            if (user.isEmailVerified) {
                throw new BadRequestException('Email already verified');
            }

            // Resend OTP
            const result = await this.otpService.resendOtp({
                email,
                type: 'email_verification',
            });

            console.log(`✅ Verification OTP resent: ${email}`);

            return result;
        } catch (error) {
            if (
                error instanceof NotFoundException ||
                error instanceof BadRequestException
            ) {
                throw error;
            }
            throw new BadRequestException('Error resending OTP');
        }
    }

    // ============================================================
    // LOGIN (WITH EMAIL VERIFICATION CHECK)
    // ============================================================

    async login(dto: LoginDto) {
        try {
            const user = await this.userModel
                .findOne({ email: dto.email })
                .select('+password')
                .exec();

            // Check credentials
            if (!user || !(await user.comparePassword(dto.password))) {
                throw new UnauthorizedException('Invalid email or password');
            }

            // Check if account is active
            if (!user.isActive) {
                throw new UnauthorizedException(
                    'Your account has been deactivated',
                );
            }

            // ✅ Check if email is verified
            if (!user.isEmailVerified) {
                // Option 1: Block login until verified (recommended)
                throw new UnauthorizedException(
                    'Please verify your email before logging in. Check your inbox for the verification code.',
                );

                // Option 2: Allow login but require verification later (uncomment if needed)
                // return {
                //     success: false,
                //     message: 'Email not verified. Please verify your email.',
                //     requiresVerification: true,
                //     data: {
                //         email: user.email,
                //     },
                // };
            }

            console.log(`✅ User logged in: ${dto.email}`);

            // Generate tokens
            const tokens = this.generateTokens(user);

            return {
                success: true,
                message: 'Login successful',
                data: {
                    user: this.safeUser(user),
                    token: tokens,
                },
            };
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw new BadRequestException('Error during login');
        }
    }

    // ============================================================
    // FORGOT PASSWORD (SEND OTP)
    // ============================================================

    async forgotPassword(email: string) {
        try {
            // Check if user exists
            const user = await this.userModel.findOne({ email }).exec();

            if (!user) {
                // Don't reveal if email exists or not (security best practice)
                return {
                    success: true,
                    message:
                        'If the email exists, a password reset OTP has been sent',
                    data: { email },
                };
            }

            // Send OTP for password reset
            await this.otpService.sendOtp({
                email,
                type: 'password_reset',
            });

            console.log(`✅ Password reset OTP sent: ${email}`);

            return {
                success: true,
                message: 'Password reset OTP sent to your email',
                data: { email },
            };
        } catch (error) {
            throw new BadRequestException('Error sending password reset OTP');
        }
    }

    // ============================================================
    // RESET PASSWORD (VERIFY OTP + UPDATE PASSWORD)
    // ============================================================

    async resetPassword(email: string, otp: string, newPassword: string) {
        try {
            // Find user
            const user = await this.userModel.findOne({ email }).exec();

            if (!user) {
                throw new NotFoundException('User not found');
            }

            // Verify OTP
            const otpResult = await this.otpService.verifyOtp({
                email,
                otp,
                type: 'password_reset',
            });

            if (!otpResult.success) {
                throw new UnauthorizedException('Invalid or expired OTP');
            }

            // Update password (hashing happens in pre-save hook)
            user.password = newPassword;
            await user.save();

            console.log(`✅ Password reset successful: ${email}`);

            return {
                success: true,
                message: 'Password reset successful. You can now login with your new password.',
                data: { email },
            };
        } catch (error) {
            if (
                error instanceof NotFoundException ||
                error instanceof UnauthorizedException
            ) {
                throw error;
            }
            throw new BadRequestException('Error resetting password');
        }
    }

    // ============================================================
    // GET ME
    // ============================================================

    async getMe(userId: string) {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        return {
            success: true,
            data: this.safeUser(user),
        };
    }

    // ============================================================
    // LOGOUT (TOKEN BLACKLIST)
    // ============================================================

    async logout(authHeader?: string) {
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];

            try {
                const decoded: any = jwt.decode(token);
                if (decoded?.exp) {
                    await this.blacklistModel.create({
                        token,
                        expiresAt: new Date(decoded.exp * 1000),
                    });
                }
            } catch (_) {
                // Ignore decode errors
            }
        }

        return {
            success: true,
            message: 'Logout successful',
        };
    }

    // ============================================================
    // OAUTH SUCCESS
    // ============================================================

    async oauthSuccess(user: any) {
        if (!user) {
            throw new UnauthorizedException('Authentication failed');
        }

        // OAuth users are automatically verified
        if (!user.isEmailVerified) {
            user.isEmailVerified = true;
            user.emailVerifiedAt = new Date();
            await user.save();
        }

        const tokens = this.generateTokens(user);

        return {
            success: true,
            message: 'OAuth authentication successful',
            data: {
                user: this.safeUser(user),
                token: tokens,
            },
        };
    }

    // ============================================================
    // HELPER METHODS
    // ============================================================

    private safeUser(user: any) {
        return {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            profileImage: user.profileImage,
            isEmailVerified: user.isEmailVerified || false,
            emailVerifiedAt: user.emailVerifiedAt,
        };
    }

    async socialLogin(dto: {
        authProvider: string;
        token?: string;
        userName: string;
        email: string;
        socialId: string;
        image?: string;
        fcmToken?: string;
    }) {
        try {
            const { authProvider, userName, email, socialId, image, fcmToken } = dto;

            // Validation
            if (!socialId) {
                throw new BadRequestException('socialId is required');
            }

            // ─── Check if email exists with password (regular signup) ───
            const userWithPassword = await this.userModel
                .findOne({ email, password: { $ne: null } })
                .select('+password')
                .exec();

            if (userWithPassword) {
                throw new UnauthorizedException(
                    'This email is already registered with a password. Please use normal login instead.',
                );
            }

            // ─── Find user by provider ID ───
            let user = await this.userModel
                .findOne({
                    [`${authProvider}Id`]: socialId, // googleId, facebookId, or appleId
                })
                .exec();

            console.log(`🔍 Social login attempt: ${authProvider} - ${email}`);

            // ─── Create new user if doesn't exist ───
            if (!user) {
                const userData: any = {
                    name: userName,
                    email,
                    isEmailVerified: true, // Social logins are pre-verified
                    emailVerifiedAt: new Date(),
                    isActive: true,
                };

                // Set provider-specific ID
                if (authProvider === 'google') userData.googleId = socialId;
                else if (authProvider === 'facebook') userData.facebookId = socialId;
                else if (authProvider === 'apple') userData.appleId = socialId;

                // Optional fields
                if (image) userData.profileImage = image;
                if (fcmToken) userData.fcmToken = fcmToken;

                user = await this.userModel.create(userData);
                console.log(`✅ New ${authProvider} user created: ${email}`);
            } else {
                console.log(`✅ Existing ${authProvider} user logged in: ${email}`);

                // Update FCM token if provided and changed
                if (fcmToken && user.fcmToken !== fcmToken) {
                    user.fcmToken = fcmToken;
                    await user.save();
                    console.log(`🔔 FCM token updated for: ${email}`);
                }
            }

            // ─── Check if account is active ───
            if (!user.isActive) {
                throw new UnauthorizedException(
                    'Your account has been deactivated. Please contact support.',
                );
            }

            // ─── Generate tokens ───
            const tokens = this.generateTokens(user);

            return {
                success: true,
                message: `${authProvider} login successful`,
                data: {
                    user: this.safeUser(user),
                    token: tokens,
                },
            };
        } catch (error) {
            console.error(`❌ Social login error:`, error);
            if (
                error instanceof BadRequestException ||
                error instanceof UnauthorizedException
            ) {
                throw error;
            }
            throw new BadRequestException('Social login failed');
        }
    }

}