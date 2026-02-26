import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
    Request,
    UploadedFiles,
    UseInterceptors,
    BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiQuery,
    ApiConsumes,
    ApiBody,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { RefundRequestService } from './refund-request.service';
import { UploadService } from '../upload/upload.service';
import {
    CreateRefundRequestDto,
    UpdateRefundStatusDto,
} from './dto/refund-request.dto';
import { createMulterOptions } from '../upload/multer.config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RefundStatus } from './schemas/refund-request.schema';

@ApiTags('Refund Requests')
@Controller('api/refunds')
export class RefundRequestController {
    constructor(
        private readonly refundRequestService: RefundRequestService,
        private readonly uploadService: UploadService,
        private readonly configService: ConfigService,
    ) { }

    // ============================================================
    // CREATE REFUND REQUEST
    // ============================================================
    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create refund request (user)' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                orderId: { type: 'string' },
                productIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of product IDs in this order',
                },
                reason: {
                    type: 'string',
                    enum: [
                        'missing',
                        'not_received',
                        'wrong_item',
                        'damaged',
                        'defective',
                        'not_as_described',
                        'counterfeit',
                    ],
                },
                description: { type: 'string' },
                attachments: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                },
            },
        },
    })
    @UseInterceptors(FilesInterceptor('images', 5, createMulterOptions(new ConfigService())))
    async create(
        @Request() req,
        @UploadedFiles() files: Express.Multer.File[],
        @Body() dto: CreateRefundRequestDto,
    ) {
        // Validate files
        if (!files || files.length === 0) {
            throw new BadRequestException('At least one attachment is required');
        }

        // Upload attachments
        const uploadedFiles = await Promise.all(
            files.map((file) => this.uploadService.uploadFile(file)),
        );
        const attachmentUrls = uploadedFiles.map((f) => f.url);

        // Include attachment URLs in DTO
        dto.images = attachmentUrls;

        // Log for debugging
        console.log('Logged in user:', req.user);
        console.log('Refund DTO:', dto);

        return this.refundRequestService.create(req.user._id, dto);
    }

    // ============================================================
    // USER ENDPOINTS
    // ============================================================
    @Get('my-refunds')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    findUserRefunds(@Request() req) {
        return this.refundRequestService.findUserRefunds(req.user._id);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    findOne(@Param('id') id: string, @Request() req) {
        return this.refundRequestService.findOne(id, req.user._id);
    }

    @Delete(':id/cancel')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    cancel(@Param('id') id: string, @Request() req) {
        return this.refundRequestService.cancel(id, req.user._id);
    }

    // ============================================================
    // ADMIN ENDPOINTS
    // ============================================================
    @Get('admin/all')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    findAll(@Query('status') status?: RefundStatus) {
        return this.refundRequestService.findAll(status);
    }

    @Get('admin/stats')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    getStats() {
        return this.refundRequestService.getStats();
    }

    @Put('admin/:id/status')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    updateStatus(
        @Param('id') id: string,
        @Body() dto: UpdateRefundStatusDto,
        @Request() req,
    ) {
        return this.refundRequestService.updateStatus(id, dto, req.user._id);
    }
}