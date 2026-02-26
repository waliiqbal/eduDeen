import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    Inject,
    forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderToPaidDto } from './dto/update-order-to-paid.dto';
import { CartService } from '../cart/cart.service';

@Injectable()
export class OrdersService {
    constructor(
        @InjectModel(Order.name)
        private orderModel: Model<OrderDocument>,

        @InjectModel(Product.name)
        private productModel: Model<ProductDocument>,

        @Inject(forwardRef(() => CartService))
        private cartService: CartService,
    ) { }

    // Create new order
    async create(createOrderDto: CreateOrderDto, userId: string) {
        try {
            const { orderItems } = createOrderDto;

            // Validate order items
            if (!orderItems || orderItems.length === 0) {
                throw new BadRequestException('No order items provided');
            }

            // Verify all products exist and have sufficient stock
            for (const item of orderItems) {
                const product = await this.productModel.findById(item.product).exec();

                if (!product) {
                    throw new NotFoundException(`Product not found: ${item.name}`);
                }

                if (product.stock < item.quantity) {
                    throw new BadRequestException(
                        `Insufficient stock for ${product.name}. Available: ${product.stock}`,
                    );
                }
            }

            // Create order
            const order = await this.orderModel.create({
                ...createOrderDto,
                user: userId,
            });

            // Reduce product stock
            for (const item of orderItems) {
                await this.productModel.findByIdAndUpdate(item.product, {
                    $inc: { stock: -item.quantity },
                });
            }

            // ✅ Clear cart after successful order creation
            try {
                await this.cartService.clearCartAfterCheckout(userId);
                console.log('✅ Cart cleared after checkout');
            } catch (error) {
                console.error('⚠️ Failed to clear cart after checkout:', error.message);
                // Don't throw error - order is already created
            }

            // Populate and return
            const populatedOrder = await this.orderModel
                .findById(order._id)
                .populate('user', 'name email')
                .exec();

            return {
                success: true,
                message: 'Order created successfully',
                data: populatedOrder,
            };
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            console.log("❌ ORDER CREATE ERROR:", error);
            throw error;
        }
    }

    // Get logged in user's orders
    async getMyOrders(userId: string) {
        try {
            const orders = await this.orderModel
                .find({ user: userId })
                .sort('-createdAt')
                .populate('user', 'name email')
                .exec();

            return {
                success: true,
                count: orders.length,
                data: orders,
            };
        } catch (error) {
            throw new BadRequestException('Error fetching orders');
        }
    }

    // Get order by ID
    async findOne(orderId: string, userId: string) {
        try {
            const order = await this.orderModel
                .findById(orderId)
                .populate('user', 'name email phone')
                .exec();

            if (!order) {
                throw new NotFoundException('Order not found');
            }

            // Check if user owns this order
            if (order.user['_id'].toString() !== userId) {
                throw new ForbiddenException('Not authorized to view this order');
            }

            return {
                success: true,
                data: order,
            };
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof ForbiddenException) {
                throw error;
            }
            throw new BadRequestException('Error fetching order');
        }
    }

    // Update order to paid
    async updateToPaid(
        orderId: string,
        updateOrderToPaidDto: UpdateOrderToPaidDto,
        userId: string,
    ) {
        try {
            const order = await this.orderModel.findById(orderId).exec();

            if (!order) {
                throw new NotFoundException('Order not found');
            }

            // Check if user owns this order
            if (order.user.toString() !== userId) {
                throw new ForbiddenException('Not authorized to update this order');
            }

            // Update order
            order.isPaid = true;
            order.paidAt = new Date();
            order.paymentResult = {
                id: updateOrderToPaidDto.id,
                status: updateOrderToPaidDto.status,
                updateTime: updateOrderToPaidDto.update_time,
                emailAddress: updateOrderToPaidDto.email_address,
            };
            order.orderStatus = 'processing';

            const updatedOrder = await order.save();

            return {
                success: true,
                message: 'Order marked as paid',
                data: updatedOrder,
            };
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof ForbiddenException) {
                throw error;
            }
            throw new BadRequestException('Error updating order');
        }
    }

    // Cancel order
    async cancel(orderId: string, userId: string) {
        try {
            const order = await this.orderModel.findById(orderId).exec();

            if (!order) {
                throw new NotFoundException('Order not found');
            }

            // Check if user owns this order
            if (order.user.toString() !== userId) {
                throw new ForbiddenException('Not authorized to cancel this order');
            }

            // Can only cancel pending or processing orders
            if (!['pending', 'processing'].includes(order.orderStatus)) {
                throw new BadRequestException(
                    `Cannot cancel order with status: ${order.orderStatus}`,
                );
            }

            // Restore product stock
            for (const item of order.orderItems) {
                await this.productModel.findByIdAndUpdate(item.product, {
                    $inc: { stock: item.quantity },
                });
            }

            order.orderStatus = 'cancelled';
            await order.save();

            return {
                success: true,
                message: 'Order cancelled successfully',
                data: order,
            };
        } catch (error) {
            if (
                error instanceof NotFoundException ||
                error instanceof ForbiddenException ||
                error instanceof BadRequestException
            ) {
                throw error;
            }
            throw new BadRequestException('Error cancelling order');
        }
    }

    // Get all orders (Admin)
    async findAll() {
        try {
            const orders = await this.orderModel
                .find({})
                .populate('user', 'name email')
                .sort('-createdAt')
                .exec();

            return {
                success: true,
                count: orders.length,
                data: orders,
            };
        } catch (error) {
            throw new BadRequestException('Error fetching orders');
        }
    }

    // Get order statistics (Admin)
    async getStatistics() {
        try {
            const [
                totalOrders,
                pendingOrders,
                processingOrders,
                shippedOrders,
                deliveredOrders,
                cancelledOrders,
                totalRevenue,
            ] = await Promise.all([
                this.orderModel.countDocuments().exec(),
                this.orderModel.countDocuments({ orderStatus: 'pending' }).exec(),
                this.orderModel.countDocuments({ orderStatus: 'processing' }).exec(),
                this.orderModel.countDocuments({ orderStatus: 'shipped' }).exec(),
                this.orderModel.countDocuments({ orderStatus: 'delivered' }).exec(),
                this.orderModel.countDocuments({ orderStatus: 'cancelled' }).exec(),
                this.orderModel.aggregate([
                    { $match: { orderStatus: { $ne: 'cancelled' } } },
                    { $group: { _id: null, total: { $sum: '$totalPrice' } } },
                ]),
            ]);

            return {
                success: true,
                data: {
                    totalOrders,
                    pendingOrders,
                    processingOrders,
                    shippedOrders,
                    deliveredOrders,
                    cancelledOrders,
                    totalRevenue: totalRevenue[0]?.total || 0,
                },
            };
        } catch (error) {
            throw new BadRequestException('Error fetching order statistics');
        }
    }

    // Update order status (Admin)
    async updateStatus(orderId: string, status: string) {
        try {
            const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

            if (!validStatuses.includes(status)) {
                throw new BadRequestException('Invalid order status');
            }

            const order = await this.orderModel.findById(orderId).exec();

            if (!order) {
                throw new NotFoundException('Order not found');
            }

            order.orderStatus = status;

            if (status === 'delivered') {
                order.isDelivered = true;
                order.deliveredAt = new Date();
            }

            await order.save();

            return {
                success: true,
                message: 'Order status updated successfully',
                data: order,
            };
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Error updating order status');
        }
    }
}