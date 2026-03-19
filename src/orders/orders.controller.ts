// import {
//     Controller,
//     Get,
//     Post,
//     Put,
//     Body,
//     Param,
//     UseGuards,
//     Request,
//     HttpCode,
//     HttpStatus,
// } from '@nestjs/common';
// import {
//     ApiTags,
//     ApiOperation,
//     ApiResponse,
//     ApiBearerAuth,
//     ApiParam,
//     ApiBody,
// } from '@nestjs/swagger';
// import { OrdersService } from './orders.service';
// import { CreateOrderDto } from './dto/create-order.dto';
// import { UpdateOrderToPaidDto } from './dto/update-order-to-paid.dto';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// // import { RolesGuard } from '../auth/guards/roles.guard';
// // import { Roles } from '../auth/decorators/roles.decorator';

// @ApiTags('Orders')
// @Controller('api/orders')
// @UseGuards(JwtAuthGuard)
// @ApiBearerAuth()
// export class OrdersController {
//     constructor(private readonly ordersService: OrdersService) { }

//     // Create new order
//     @Post()
//     @ApiOperation({ summary: 'Create new order' })
//     @ApiResponse({ status: 201, description: 'Order created successfully' })
//     @ApiResponse({ status: 400, description: 'Invalid order data or insufficient stock' })
//     @ApiResponse({ status: 401, description: 'Unauthorized' })
//     @HttpCode(HttpStatus.CREATED)
//     create(@Body() createOrderDto: CreateOrderDto, @Request() req) {
//         return this.ordersService.create(createOrderDto, req.user._id);
//     }

//     // Get my orders
//     @Get('myorders')
//     @ApiOperation({ summary: 'Get logged in user orders' })
//     @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
//     @ApiResponse({ status: 401, description: 'Unauthorized' })
//     getMyOrders(@Request() req) {
//         return this.ordersService.getMyOrders(req.user._id);
//     }

//     // Get all orders (Admin)
//     @Get()
//     // @UseGuards(RolesGuard)  // Uncomment when RolesGuard is ready
//     // @Roles('admin')  // Uncomment when Roles decorator is ready
//     @ApiOperation({ summary: 'Get all orders (Admin only)' })
//     @ApiResponse({ status: 200, description: 'All orders retrieved successfully' })
//     @ApiResponse({ status: 401, description: 'Unauthorized' })
//     findAll() {
//         return this.ordersService.findAll();
//     }

//     // Get order statistics (Admin)
//     @Get('admin/statistics')
//     // @UseGuards(RolesGuard)  // Uncomment when RolesGuard is ready
//     // @Roles('admin')  // Uncomment when Roles decorator is ready
//     @ApiOperation({ summary: 'Get order statistics (Admin only)' })
//     @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
//     @ApiResponse({ status: 401, description: 'Unauthorized' })
//     getStatistics() {
//         return this.ordersService.getStatistics();
//     }

//     // Get single order
//     @Get(':id')
//     @ApiOperation({ summary: 'Get order by ID' })
//     @ApiParam({ name: 'id', description: 'Order ID' })
//     @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
//     @ApiResponse({ status: 403, description: 'Not authorized to view this order' })
//     @ApiResponse({ status: 404, description: 'Order not found' })
//     findOne(@Param('id') id: string, @Request() req) {
//         return this.ordersService.findOne(id, req.user._id);
//     }

//     // Update order to paid
//     @Put(':id/pay')
//     @ApiOperation({ summary: 'Update order to paid' })
//     @ApiParam({ name: 'id', description: 'Order ID' })
//     @ApiBody({ type: UpdateOrderToPaidDto })
//     @ApiResponse({ status: 200, description: 'Order marked as paid' })
//     @ApiResponse({ status: 403, description: 'Not authorized to update this order' })
//     @ApiResponse({ status: 404, description: 'Order not found' })
//     updateToPaid(
//         @Param('id') id: string,
//         @Body() updateOrderToPaidDto: UpdateOrderToPaidDto,
//         @Request() req,
//     ) {
//         return this.ordersService.updateToPaid(id, updateOrderToPaidDto, req.user._id);
//     }

//     // Cancel order
//     @Put(':id/cancel')
//     @ApiOperation({ summary: 'Cancel order' })
//     @ApiParam({ name: 'id', description: 'Order ID' })
//     @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
//     @ApiResponse({ status: 400, description: 'Cannot cancel order with current status' })
//     @ApiResponse({ status: 403, description: 'Not authorized to cancel this order' })
//     @ApiResponse({ status: 404, description: 'Order not found' })
//     cancel(@Param('id') id: string, @Request() req) {
//         return this.ordersService.cancel(id, req.user._id);
//     }

//     // Update order status (Admin)
//     @Put(':id/status')
//     // @UseGuards(RolesGuard)  // Uncomment when RolesGuard is ready
//     // @Roles('admin')  // Uncomment when Roles decorator is ready
//     @ApiOperation({ summary: 'Update order status (Admin only)' })
//     @ApiParam({ name: 'id', description: 'Order ID' })
//     @ApiBody({
//         schema: {
//             type: 'object',
//             properties: {
//                 status: {
//                     type: 'string',
//                     enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
//                 },
//             },
//         },
//     })
//     @ApiResponse({ status: 200, description: 'Order status updated successfully' })
//     @ApiResponse({ status: 404, description: 'Order not found' })
//     updateStatus(@Param('id') id: string, @Body('status') status: string) {
//         return this.ordersService.updateStatus(id, status);
//     }
// }