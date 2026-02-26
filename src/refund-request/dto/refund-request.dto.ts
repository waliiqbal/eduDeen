import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
    IsArray,
    IsEnum,
    IsMongoId,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';
import { RefundReason, RefundStatus } from '../schemas/refund-request.schema';

export class CreateRefundRequestDto {
    @ApiProperty({
        example: '507f1f77bcf86cd799439011',
        description: 'Order ID',
    })
    @IsMongoId()
    @IsNotEmpty()
    orderId: string;

    @ApiProperty({
        type: [String],
        example: ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'],
        description: 'Array of product IDs to refund',
    })
    @IsArray()
    @IsMongoId({ each: true })
    @IsNotEmpty()
    productIds: string[];

    @ApiProperty({
        enum: RefundReason,
        example: RefundReason.DAMAGED,
        description: 'Reason for refund',
    })
    @IsEnum(RefundReason)
    @IsNotEmpty()
    reason: RefundReason;

    @ApiProperty({
        required: false,
        example: 'The book arrived with torn pages',
        description: 'Additional details about the issue',
    })
    @IsOptional()
    @IsString()
    message?: string;

    @ApiProperty({
        type: [String],
        required: false,
        example: [
            'https://res.cloudinary.com/.../image1.jpg',
            'https://res.cloudinary.com/.../image2.jpg',
        ],
        description: 'Evidence images (Cloudinary URLs)',
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    images?: string[];
}

export class UpdateRefundStatusDto {
    @ApiProperty({
        enum: RefundStatus,
        example: RefundStatus.APPROVED,
        description: 'New status',
    })
    @IsEnum(RefundStatus)
    @IsNotEmpty()
    status: RefundStatus;

    @ApiProperty({
        required: false,
        example: 'Refund approved. Amount will be credited in 3-5 business days.',
        description: "Admin's note",
    })
    @IsOptional()
    @IsString()
    adminNote?: string;
}

export class RefundStatsResponseDto {
    @ApiProperty({ example: 45 })
    total: number;

    @ApiProperty({ example: 12 })
    pending: number;

    @ApiProperty({ example: 8 })
    reviewing: number;

    @ApiProperty({ example: 15 })
    approved: number;

    @ApiProperty({ example: 5 })
    rejected: number;

    @ApiProperty({ example: 5 })
    completed: number;
}