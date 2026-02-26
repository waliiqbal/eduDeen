import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
    RefundRequest,
    RefundRequestDocument,
    RefundStatus,
} from './schemas/refund-request.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import {
    CreateRefundRequestDto,
    UpdateRefundStatusDto,
} from './dto/refund-request.dto';

@Injectable()
export class RefundRequestService {
    constructor(
        @InjectModel(RefundRequest.name)
        private refundModel: Model<RefundRequestDocument>,

        @InjectModel(Order.name)
        private orderModel: Model<OrderDocument>,
    ) { }

    // ═══════════════════════════════════════════
    // USER ENDPOINTS
    // ═══════════════════════════════════════════

    async create(userId: string, dto: CreateRefundRequestDto) {
        // 1. Verify order exists and belongs to user
        // const order = await this.orderModel
        //     .findOne({
        //         _id: dto.orderId,
        //         user: new Types.ObjectId(userId),
        //     })
        //     .exec();
        const order = await this.orderModel.findById(dto.orderId);

        if (!order) {
            throw new NotFoundException(
                'Order not found or does not belong to you',
            );
        }

        // 2. Check if order is eligible for refund
        // ✅ FIXED: Check your Order schema for the correct status field name
        // Options: order.status OR order.orderStatus
        if (order.orderStatus === 'cancelled') {
            throw new BadRequestException(
                'Cannot request refund for cancelled order',
            );
        }

        // 3. Check if refund already exists for this order
        const existingRefund = await this.refundModel
            .findOne({
                order: dto.orderId,
                status: { $nin: [RefundStatus.REJECTED, RefundStatus.CANCELLED] },
            })
            .exec();

        if (existingRefund) {
            throw new BadRequestException(
                'A refund request already exists for this order',
            );
        }

        // 4. Verify products belong to this order
        // ✅ FIXED: Check your Order schema for the correct items field name
        // Options: order.items OR order.orderItems
        const orderProductIds = order.orderItems.map((item) =>
            item.product.toString(),
        );
        const invalidProducts = dto.productIds.filter(
            (id) => !orderProductIds.includes(id),
        );

        if (invalidProducts.length > 0) {
            throw new BadRequestException(
                'Some products do not belong to this order',
            );
        }

        // 5. Calculate refund amount
        const refundAmount = order.orderItems
            .filter((item) => dto.productIds.includes(item.product.toString()))
            .reduce((sum, item) => sum + item.price * item.quantity, 0);

        // 6. Create refund request
        // ✅ FIXED: Use order._id.toString() for orderNumber
        const refund = await this.refundModel.create({
            user: new Types.ObjectId(userId),
            order: new Types.ObjectId(dto.orderId),
            orderNumber: order._id.toString(),
            productIds: dto.productIds.map((id) => new Types.ObjectId(id)),
            reason: dto.reason,
            message: dto.message,
            images: dto.images || [],
            refundAmount,
            status: RefundStatus.PENDING,
        });

        console.log(
            `✅ Refund request created: ${refund._id} for order ${order._id}`,
        );

        return {
            success: true,
            message: 'Refund request submitted successfully',
            data: await this.refundModel
                .findById(refund._id)
                .populate('order', '_id totalAmount orderStatus')
                .populate('productIds', 'name price images')
                .exec(),
        };
    }

    async findUserRefunds(userId: string) {
        const refunds = await this.refundModel
            .find({ user: new Types.ObjectId(userId) })
            .populate('order', '_id totalAmount orderStatus')
            .populate('productIds', 'name price images')
            .sort({ createdAt: -1 })
            .exec();

        return {
            success: true,
            count: refunds.length,
            data: refunds,
        };
    }

    async findOne(id: string, userId: string) {
        const refund = await this.refundModel
            .findOne({
                _id: id,
                user: new Types.ObjectId(userId),
            })
            .populate('order', '_id totalAmount orderStatus orderItems')
            .populate('productIds', 'name price images')
            .exec();

        if (!refund) {
            throw new NotFoundException('Refund request not found');
        }

        return {
            success: true,
            data: refund,
        };
    }

    async cancel(id: string, userId: string) {
        const refund = await this.refundModel
            .findOne({
                _id: id,
                user: new Types.ObjectId(userId),
            })
            .exec();

        if (!refund) {
            throw new NotFoundException('Refund request not found');
        }

        if (refund.status !== RefundStatus.PENDING) {
            throw new BadRequestException(
                'Can only cancel pending refund requests',
            );
        }

        refund.status = RefundStatus.CANCELLED;
        await refund.save();

        console.log(`✅ Refund request cancelled by user: ${id}`);

        return {
            success: true,
            message: 'Refund request cancelled successfully',
        };
    }

    // ═══════════════════════════════════════════
    // ADMIN ENDPOINTS
    // ═══════════════════════════════════════════

    async findAll(status?: RefundStatus) {
        const filter: any = {};
        if (status) filter.status = status;

        const refunds = await this.refundModel
            .find(filter)
            .populate('user', 'name email')
            .populate('order', '_id totalAmount orderStatus')
            .populate('productIds', 'name price images')
            .sort({ createdAt: -1 })
            .exec();

        return {
            success: true,
            count: refunds.length,
            data: refunds,
        };
    }

    async getStats() {
        const stats = await this.refundModel.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                },
            },
        ]);

        const total = await this.refundModel.countDocuments();

        const result = {
            total,
            pending: 0,
            reviewing: 0,
            approved: 0,
            rejected: 0,
            processing: 0,
            completed: 0,
            cancelled: 0,
        };

        stats.forEach((stat) => {
            result[stat._id] = stat.count;
        });

        return {
            success: true,
            data: result,
        };
    }

    async updateStatus(
        id: string,
        dto: UpdateRefundStatusDto,
        adminId: string,
    ) {
        const refund = await this.refundModel.findById(id).exec();

        if (!refund) {
            throw new NotFoundException('Refund request not found');
        }

        this.validateStatusTransition(refund.status, dto.status);

        refund.status = dto.status;
        if (dto.adminNote) refund.adminNote = dto.adminNote;
        refund.reviewedBy = new Types.ObjectId(adminId);

        if (dto.status === RefundStatus.REVIEWING) {
            refund.reviewedAt = new Date();
        } else if (dto.status === RefundStatus.PROCESSING) {
            refund.processedAt = new Date();
        } else if (dto.status === RefundStatus.COMPLETED) {
            refund.completedAt = new Date();
        }

        await refund.save();

        console.log(
            `✅ Refund status updated: ${id} → ${dto.status} by admin ${adminId}`,
        );

        return {
            success: true,
            message: `Refund request ${dto.status}`,
            data: await this.refundModel
                .findById(id)
                .populate('user', 'name email')
                .populate('order', '_id totalAmount')
                .populate('productIds', 'name price images')
                .exec(),
        };
    }

    private validateStatusTransition(
        currentStatus: RefundStatus,
        newStatus: RefundStatus,
    ) {
        const validTransitions: Record<RefundStatus, RefundStatus[]> = {
            [RefundStatus.PENDING]: [RefundStatus.REVIEWING, RefundStatus.REJECTED],
            [RefundStatus.REVIEWING]: [
                RefundStatus.APPROVED,
                RefundStatus.REJECTED,
            ],
            [RefundStatus.APPROVED]: [RefundStatus.PROCESSING],
            [RefundStatus.PROCESSING]: [RefundStatus.COMPLETED],
            [RefundStatus.REJECTED]: [],
            [RefundStatus.COMPLETED]: [],
            [RefundStatus.CANCELLED]: [],
        };

        if (!validTransitions[currentStatus].includes(newStatus)) {
            throw new BadRequestException(
                `Cannot transition from ${currentStatus} to ${newStatus}`,
            );
        }
    }
}