import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { RefundRequestController } from './refund-request.controller';
import { RefundRequestService } from './refund-request.service';
import {
    RefundRequest,
    RefundRequestSchema,
} from './schemas/refund-request.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { UploadModule } from '../upload/upload.module'; // ✅ Import UploadModule

@Module({
    imports: [
        ConfigModule, // ✅ Added for ConfigService
        MongooseModule.forFeature([
            { name: RefundRequest.name, schema: RefundRequestSchema },
            { name: Order.name, schema: OrderSchema },
        ]),
        UploadModule, // ✅ Import UploadModule for Cloudinary
    ],
    controllers: [RefundRequestController],
    providers: [RefundRequestService],
    exports: [RefundRequestService],
})
export class RefundRequestModule { }