import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';
import { EmailService } from './services/email.service';
import { Otp, OtpSchema } from './schemas/otp.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Otp.name, schema: OtpSchema }]),
    ],
    controllers: [OtpController],
    providers: [OtpService, EmailService],
    exports: [OtpService, EmailService],
})
export class OtpModule { }