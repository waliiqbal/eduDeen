import {
    Injectable,
    BadRequestException,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as jwt from 'jsonwebtoken';
import { User, UserDocument } from '../users/schemas/user.schema';
import { TokenBlacklist } from './schemas/token-blacklist.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name)
        private userModel: Model<UserDocument>,

        @InjectModel(TokenBlacklist.name)
        private blacklistModel: Model<TokenBlacklist>,
        private jwtService: JwtService,
    ) { }

    generateTokens(user: User) {
        const payload = { _id: user._id, email: user.email };

        const accessToken = this.jwtService.sign(payload, {
            expiresIn: '15m',
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

    // REGISTER
    async register(dto: RegisterDto) {
        const { name, email, password, phone, address } = dto;

        const userExists = await this.userModel.findOne({ email });
        if (userExists) {
            throw new BadRequestException(
                'User already exists with this email',
            );
        }

        // Password hashing should happen in User schema pre-save hook
        const user = await this.userModel.create({
            name,
            email,
            password,
            phone,
            address
        });

        const token = this.generateTokens(user);

        return {
            success: true,
            message: 'User registered successfully',
            data: {
                user: this.safeUser(user),
                token,
            },
        };
    }

    // LOGIN
    async login(dto: LoginDto) {
        const user = await this.userModel
            .findOne({ email: dto.email })
            .select('+password');

        if (!user || !(await user.comparePassword(dto.password))) {
            throw new UnauthorizedException('Invalid email or password');
        }

        if (!user.isActive) {
            throw new UnauthorizedException(
                'Your account has been deactivated',
            );
        }

        const token = this.generateTokens(user);

        return {
            success: true,
            message: 'Login successful',
            data: {
                user: this.safeUser(user),
                token,
            },
        };
    }

    // GET ME
    async getMe(userId: string) {
        const user = await this.userModel.findById(userId);
        return {
            success: true,
            data: user,
        };
    }

    // LOGOUT (token blacklist)
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
            } catch (_) { }
        }

        return {
            success: true,
            message: 'Logout successful',
        };
    }

    // OAUTH SUCCESS
    // ✅ FIXED: Now uses generateTokens() for consistency
    async oauthSuccess(user: any) {
        if (!user) {
            throw new UnauthorizedException('Authentication failed');
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

    // helpers
    private safeUser(user: any) {
        return {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            profileImage: user.profileImage,
        };
    }
}