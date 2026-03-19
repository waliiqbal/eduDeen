// import {
//     Controller,
//     Get,
//     Post,
//     Put,
//     Delete,
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
// } from '@nestjs/swagger';
// import { CartService } from './cart.service';
// import { AddToCartDto, UpdateCartItemDto } from './dto/add-to-cart.dto';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// @ApiTags('Cart')
// @Controller('api/cart')
// @UseGuards(JwtAuthGuard)
// @ApiBearerAuth()
// export class CartController {
//     constructor(private readonly cartService: CartService) { }

//     // Get user's cart
//     @Get()
//     @ApiOperation({ summary: 'Get user cart' })
//     @ApiResponse({ status: 200, description: 'Cart retrieved successfully' })
//     @ApiResponse({ status: 401, description: 'Unauthorized' })
//     getCart(@Request() req) {
//         return this.cartService.getCart(req.user._id);
//     }

//     // Get cart item count
//     @Get('count')
//     @ApiOperation({ summary: 'Get cart item count (for badge)' })
//     @ApiResponse({ status: 200, description: 'Count retrieved successfully' })
//     getCartItemCount(@Request() req) {
//         return this.cartService.getCartItemCount(req.user._id);
//     }

//     // Validate cart before checkout
//     @Get('validate')
//     @ApiOperation({ summary: 'Validate cart before checkout' })
//     @ApiResponse({ status: 200, description: 'Cart validated' })
//     @ApiResponse({ status: 400, description: 'Cart validation failed' })
//     validateCart(@Request() req) {
//         return this.cartService.validateCart(req.user._id);
//     }

//     // Sync cart with current product data
//     @Post('sync')
//     @ApiOperation({ summary: 'Sync cart with current product prices and availability' })
//     @ApiResponse({ status: 200, description: 'Cart synced successfully' })
//     @HttpCode(HttpStatus.OK)
//     syncCart(@Request() req) {
//         return this.cartService.syncCart(req.user._id);
//     }

//     // Add item to cart
//     @Post('items')
//     @ApiOperation({ summary: 'Add item to cart' })
//     @ApiResponse({ status: 200, description: 'Item added to cart' })
//     @ApiResponse({ status: 400, description: 'Invalid data or insufficient stock' })
//     @ApiResponse({ status: 404, description: 'Product not found' })
//     @HttpCode(HttpStatus.OK)
//     addToCart(@Request() req, @Body() addToCartDto: AddToCartDto) {
//         return this.cartService.addToCart(req.user._id, addToCartDto);
//     }

//     // Update cart item quantity
//     @Put('items/:productId')
//     @ApiOperation({ summary: 'Update cart item quantity' })
//     @ApiParam({ name: 'productId', description: 'Product ID' })
//     @ApiResponse({ status: 200, description: 'Cart item updated' })
//     @ApiResponse({ status: 400, description: 'Invalid quantity or insufficient stock' })
//     @ApiResponse({ status: 404, description: 'Item not found in cart' })
//     updateCartItem(
//         @Request() req,
//         @Param('productId') productId: string,
//         @Body() updateCartItemDto: UpdateCartItemDto,
//     ) {
//         return this.cartService.updateCartItem(
//             req.user._id,
//             productId,
//             updateCartItemDto,
//         );
//     }

//     // Remove item from cart
//     @Delete('items/:productId')
//     @ApiOperation({ summary: 'Remove item from cart' })
//     @ApiParam({ name: 'productId', description: 'Product ID' })
//     @ApiResponse({ status: 200, description: 'Item removed from cart' })
//     @ApiResponse({ status: 404, description: 'Item not found in cart' })
//     removeFromCart(@Request() req, @Param('productId') productId: string) {
//         return this.cartService.removeFromCart(req.user._id, productId);
//     }

//     // Clear entire cart
//     @Delete()
//     @ApiOperation({ summary: 'Clear entire cart' })
//     @ApiResponse({ status: 200, description: 'Cart cleared successfully' })
//     clearCart(@Request() req) {
//         return this.cartService.clearCart(req.user._id);
//     }
// }