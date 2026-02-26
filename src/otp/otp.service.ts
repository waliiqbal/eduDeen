import {
    Injectable,
    BadRequestException,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Otp, OtpDocument } from './schemas/otp.schema';
import { EmailService } from './services/email.service';
import { SendOtpDto, VerifyOtpDto, ResendOtpDto } from './dto/otp.dto';
import * as crypto from 'crypto';

@Injectable()
export class OtpService {
    constructor(
        @InjectModel(Otp.name)
        private otpModel: Model<OtpDocument>,
        private emailService: EmailService,
    ) { }

    // Generate random 6-digit OTP
    private generateOtp(): string {
        return crypto.randomInt(100000, 999999).toString();
    }

    // Send OTP
    async sendOtp(
        sendOtpDto: SendOtpDto,
        ipAddress?: string,
        userAgent?: string,
    ) {
        try {
            const { email, type = 'email_verification' } = sendOtpDto;

            console.log(`🔄 Sending OTP to ${email} for ${type}`);

            // Check rate limiting - max 3 OTPs per 15 minutes
            const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
            const recentOtps = await this.otpModel
                .countDocuments({
                    email,
                    type,
                    createdAt: { $gte: fifteenMinutesAgo },
                })
                .exec();

            if (recentOtps >= 3) {
                throw new BadRequestException(
                    'Too many OTP requests. Please try again after 15 minutes.',
                );
            }

            // Invalidate any existing unused OTPs
            await this.otpModel.updateMany(
                { email, type, isUsed: false },
                { $set: { isUsed: true, usedAt: new Date() } },
            );

            // Generate new OTP
            const otp = this.generateOtp();

            // Calculate expiry (default 10 minutes)
            const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES as string) || 10;
            const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

            // Save OTP to database
            await this.otpModel.create({
                email,
                otp,
                type,
                expiresAt,
                ipAddress,
                userAgent,
            });

            // Send email
            const emailSent = await this.emailService.sendOtpEmail(email, otp, type);

            if (!emailSent) {
                throw new BadRequestException('Failed to send OTP email');
            }

            console.log(`✅ OTP sent to ${email}`);

            return {
                success: true,
                message: 'OTP sent successfully',
                data: {
                    email,
                    expiresIn: `${expiryMinutes} minutes`,
                },
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            console.error('❌ Error sending OTP:', error);
            throw new BadRequestException('Error sending OTP');
        }
    }

    // Verify OTP
    async verifyOtp(verifyOtpDto: VerifyOtpDto) {
        try {
            const { email, otp, type = 'email_verification' } = verifyOtpDto;

            console.log(`🔄 Verifying OTP for ${email}`);

            // Find the most recent unused OTP
            const otpRecord = await this.otpModel
                .findOne({
                    email,
                    type,
                    isUsed: false,
                })
                .sort({ createdAt: -1 })
                .exec();

            if (!otpRecord) {
                throw new NotFoundException('OTP not found or already used');
            }

            // Check if expired
            if (otpRecord.isExpired()) {
                throw new BadRequestException('OTP has expired');
            }

            // Check max attempts
            if (otpRecord.attempts >= otpRecord.maxAttempts) {
                throw new BadRequestException(
                    'Maximum verification attempts exceeded. Please request a new OTP.',
                );
            }

            // Increment attempts
            otpRecord.attempts += 1;
            await otpRecord.save();

            // Verify OTP
            if (otpRecord.otp !== otp) {
                const attemptsLeft = otpRecord.maxAttempts - otpRecord.attempts;
                throw new UnauthorizedException(
                    `Invalid OTP. ${attemptsLeft} attempt(s) remaining.`,
                );
            }

            // Mark as used
            otpRecord.isUsed = true;
            otpRecord.usedAt = new Date();
            await otpRecord.save();

            console.log(`✅ OTP verified for ${email}`);

            return {
                success: true,
                message: 'OTP verified successfully',
                data: {
                    email,
                    verifiedAt: new Date(),
                },
            };
        } catch (error) {
            if (
                error instanceof NotFoundException ||
                error instanceof BadRequestException ||
                error instanceof UnauthorizedException
            ) {
                throw error;
            }
            console.error('❌ Error verifying OTP:', error);
            throw new BadRequestException('Error verifying OTP');
        }
    }

    // Resend OTP
    async resendOtp(
        resendOtpDto: ResendOtpDto,
        ipAddress?: string,
        userAgent?: string,
    ) {
        try {
            const { email, type = 'email_verification' } = resendOtpDto;

            console.log(`🔄 Resending OTP to ${email}`);

            // Check if there's a recent OTP (within last 1 minute)
            const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
            const recentOtp = await this.otpModel
                .findOne({
                    email,
                    type,
                    createdAt: { $gte: oneMinuteAgo },
                })
                .exec();

            if (recentOtp) {
                throw new BadRequestException(
                    'Please wait 1 minute before requesting a new OTP',
                );
            }

            // Send new OTP
            return this.sendOtp({ email, type }, ipAddress, userAgent);
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Error resending OTP');
        }
    }

    // Clean up expired OTPs (optional - can be run as a cron job)
    async cleanupExpiredOtps() {
        try {
            const result = await this.otpModel
                .deleteMany({
                    expiresAt: { $lt: new Date() },
                })
                .exec();

            console.log(`🧹 Cleaned up ${result.deletedCount} expired OTPs`);

            return {
                success: true,
                deletedCount: result.deletedCount,
            };
        } catch (error) {
            console.error('❌ Error cleaning up OTPs:', error);
            throw new BadRequestException('Error cleaning up OTPs');
        }
    }

    // Get OTP statistics (admin)
    async getStatistics() {
        try {
            const [
                totalOtps,
                usedOtps,
                unusedOtps,
                expiredOtps,
            ] = await Promise.all([
                this.otpModel.countDocuments().exec(),
                this.otpModel.countDocuments({ isUsed: true }).exec(),
                this.otpModel.countDocuments({ isUsed: false }).exec(),
                this.otpModel
                    .countDocuments({ expiresAt: { $lt: new Date() } })
                    .exec(),
            ]);

            return {
                success: true,
                data: {
                    totalOtps,
                    usedOtps,
                    unusedOtps,
                    expiredOtps,
                },
            };
        } catch (error) {
            throw new BadRequestException('Error fetching statistics');
        }
    }
}