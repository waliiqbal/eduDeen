import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
// import { GoogleStrategy } from './strategies/google.strategy';
import { User, UserSchema } from '../users/schemas/user.schema';
import { TokenBlacklist, TokenBlacklistSchema } from './schemas/token-blacklist.schema';
import { AppModule } from 'src/app.module';
import { OtpModule } from 'src/otp/otp.module';

@Module({
    imports: [
        OtpModule,
        PassportModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET,
        }),
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: TokenBlacklist.name, schema: TokenBlacklistSchema },
        ]),
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        JwtStrategy,
        JwtRefreshStrategy,
    ],
})
export class AuthModule { }