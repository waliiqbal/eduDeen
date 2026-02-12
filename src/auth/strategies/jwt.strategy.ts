import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TokenBlacklist } from '../schemas/token-blacklist.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        @InjectModel(TokenBlacklist.name)
        private blacklistModel: Model<TokenBlacklist>,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.JWT_SECRET,
            passReqToCallback: true, // ✅ Enable request in validate
        });
    }

    async validate(req: any, payload: any) {
        // ✅ Check if token is blacklisted
        const token = req.headers.authorization?.split(' ')[1];

        if (token) {
            const blacklisted = await this.blacklistModel.findOne({ token });
            if (blacklisted) {
                throw new UnauthorizedException('Token has been revoked');
            }
        }

        return payload; // attached to req.user
    }
}