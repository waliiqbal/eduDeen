import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cart, CartDocument } from './schemas/cart.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/add-to-cart.dto';
import { ValidationErrorDto } from './dto/validate-cart-response.dto';


@Injectable()
export class CartService {
    constructor(
        @InjectModel(Cart.name)
        private cartModel: Model<CartDocument>,

        @InjectModel(Product.name)
        private productModel: Model<ProductDocument>,
    ) { }

    // Get user's cart (create if doesn't exist)
    async getCart(userId: string) {
        try {
            let cart = await this.cartModel
                .findOne({ user: userId })
                .populate('items.product', 'name price images stock brand isFeatured isActive')
                .exec();

            if (!cart) {
                // Create new cart if doesn't exist
                cart = await this.cartModel.create({
                    user: userId,
                    items: [],
                    totalItems: 0,
                    totalPrice: 0,
                });
            }

            // Filter out items with inactive products
            const validItems = cart.items.filter((item) => {
                const product = item.product as any;
                return product && product.isActive;
            });

            if (validItems.length !== cart.items.length) {
                cart.items = validItems;
                (cart as any).updateTotals();
                await cart.save();
            }

            return {
                success: true,
                data: cart,
            };
        } catch (error) {
            throw new BadRequestException('Error fetching cart');
        }
    }

    // Add item to cart
    async addToCart(userId: string, addToCartDto: AddToCartDto) {
        try {
            const { productId, quantity = 1 } = addToCartDto;

            // Verify product exists and is active
            const product = await this.productModel.findById(productId).exec();

            if (!product) {
                throw new NotFoundException('Product not found');
            }

            if (!product.isActive) {
                throw new BadRequestException('Product is not available');
            }

            // Check stock availability
            if (product.stock < quantity) {
                throw new BadRequestException(
                    `Only ${product.stock} items available in stock`,
                );
            }

            // Get or create cart
            let cart = await this.cartModel.findOne({ user: userId }).exec();

            if (!cart) {
                cart = await this.cartModel.create({
                    user: userId,
                    items: [],
                    totalItems: 0,
                    totalPrice: 0,
                });
            }

            // Check if product already in cart
            const existingItemIndex = cart.items.findIndex(
                (item) => item.product.toString() === productId,
            );

            if (existingItemIndex > -1) {
                // Update quantity of existing item
                const newQuantity = cart.items[existingItemIndex].quantity + quantity;

                // Check stock for new quantity
                if (product.stock < newQuantity) {
                    throw new BadRequestException(
                        `Only ${product.stock} items available in stock`,
                    );
                }

                cart.items[existingItemIndex].quantity = newQuantity;
            } else {
                // Add new item to cart
                cart.items.push({
                    product: product._id,
                    name: product.name,
                    quantity,
                    price: product.price,
                    image: product.images?.[0],
                    brand: product.brand,
                    addedAt: new Date(),
                });
            }

            // Update totals
            (cart as any).updateTotals();
            await cart.save();

            // Populate and return
            const populatedCart = await this.cartModel
                .findById(cart._id)
                .populate('items.product', 'name price images stock brand')
                .exec();

            return {
                success: true,
                message: 'Item added to cart',
                data: populatedCart,
            };
        } catch (error) {
            if (
                error instanceof NotFoundException ||
                error instanceof BadRequestException
            ) {
                throw error;
            }
            throw new BadRequestException('Error adding item to cart');
        }
    }

    // Update cart item quantity
    async updateCartItem(
        userId: string,
        productId: string,
        updateCartItemDto: UpdateCartItemDto,
    ) {
        try {
            const { quantity } = updateCartItemDto;

            const cart = await this.cartModel.findOne({ user: userId }).exec();

            if (!cart) {
                throw new NotFoundException('Cart not found');
            }

            // Find item in cart
            const itemIndex = cart.items.findIndex(
                (item) => item.product.toString() === productId,
            );

            if (itemIndex === -1) {
                throw new NotFoundException('Item not found in cart');
            }

            // Verify product and stock
            const product = await this.productModel.findById(productId).exec();

            if (!product) {
                throw new NotFoundException('Product not found');
            }

            if (product.stock < quantity) {
                throw new BadRequestException(
                    `Only ${product.stock} items available in stock`,
                );
            }

            // Update quantity
            cart.items[itemIndex].quantity = quantity;
            cart.items[itemIndex].price = product.price; // Update price in case it changed

            // Update totals
            (cart as any).updateTotals();
            await cart.save();

            // Populate and return
            const populatedCart = await this.cartModel
                .findById(cart._id)
                .populate('items.product', 'name price images stock brand')
                .exec();

            return {
                success: true,
                message: 'Cart updated successfully',
                data: populatedCart,
            };
        } catch (error) {
            if (
                error instanceof NotFoundException ||
                error instanceof BadRequestException
            ) {
                throw error;
            }
            throw new BadRequestException('Error updating cart');
        }
    }

    // Remove item from cart
    async removeFromCart(userId: string, productId: string) {
        try {
            const cart = await this.cartModel.findOne({ user: userId }).exec();

            if (!cart) {
                throw new NotFoundException('Cart not found');
            }

            // Filter out the item
            const itemExists = cart.items.some(
                (item) => item.product.toString() === productId,
            );

            if (!itemExists) {
                throw new NotFoundException('Item not found in cart');
            }

            cart.items = cart.items.filter(
                (item) => item.product.toString() !== productId,
            );

            // Update totals
            (cart as any).updateTotals();
            await cart.save();

            // Populate and return
            const populatedCart = await this.cartModel
                .findById(cart._id)
                .populate('items.product', 'name price images stock brand')
                .exec();

            return {
                success: true,
                message: 'Item removed from cart',
                data: populatedCart,
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Error removing item from cart');
        }
    }

    // Clear entire cart
    async clearCart(userId: string) {
        try {
            const cart = await this.cartModel.findOne({ user: userId }).exec();

            if (!cart) {
                throw new NotFoundException('Cart not found');
            }

            cart.items = [];
            cart.totalItems = 0;
            cart.totalPrice = 0;
            await cart.save();

            return {
                success: true,
                message: 'Cart cleared successfully',
                data: cart,
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Error clearing cart');
        }
    }

    // Sync cart items with current product prices and availability
    async syncCart(userId: string) {
        try {
            const cart = await this.cartModel.findOne({ user: userId }).exec();

            if (!cart) {
                throw new NotFoundException('Cart not found');
            }

            const syncedItems: typeof cart.items = [];
            let hasChanges = false;

            for (const item of cart.items) {
                const product = await this.productModel
                    .findById(item.product)
                    .exec();

                // Remove items with deleted or inactive products
                if (!product || !product.isActive) {
                    hasChanges = true;
                    continue;
                }

                // Update price if changed
                if (item.price !== product.price) {
                    item.price = product.price;
                    hasChanges = true;
                }

                // Adjust quantity if exceeds stock
                if (item.quantity > product.stock) {
                    item.quantity = product.stock;
                    hasChanges = true;
                }

                // Remove items with zero stock
                if (product.stock === 0) {
                    hasChanges = true;
                    continue;
                }

                syncedItems.push(item);
            }

            if (hasChanges) {
                cart.items = syncedItems;
                (cart as any).updateTotals();
                await cart.save();
            }

            // Populate and return
            const populatedCart = await this.cartModel
                .findById(cart._id)
                .populate('items.product', 'name price images stock brand')
                .exec();

            return {
                success: true,
                message: hasChanges ? 'Cart synced with updates' : 'Cart is up to date',
                hasChanges,
                data: populatedCart,
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Error syncing cart');
        }
    }

    // Validate cart before checkout
    async validateCart(userId: string) {
        const errors: ValidationErrorDto[] = [];


        try {
            const cart = await this.cartModel
                .findOne({ user: userId })
                .populate('items.product')
                .exec();

            if (!cart || cart.items.length === 0) {
                throw new BadRequestException('Cart is empty');
            }


            for (const item of cart.items) {
                const product = item.product as any;

                if (!product) {
                    errors.push({
                        productId: item.product as string,
                        name: item.name,
                        error: 'Product no longer exists',
                    });
                    continue;
                }

                if (!product.isActive) {
                    errors.push({
                        productId: product._id,
                        name: product.name,
                        error: 'Product is no longer available',
                    });
                }

                if (product.stock === 0) {
                    errors.push({
                        productId: product._id,
                        name: product.name,
                        error: 'Product is out of stock',
                    });
                }

                if (product.stock < item.quantity) {
                    errors.push({
                        productId: product._id,
                        name: product.name,
                        error: `Only ${product.stock} items available, but ${item.quantity} in cart`,
                    });
                }

                if (product.price !== item.price) {
                    errors.push({
                        productId: product._id,
                        name: product.name,
                        error: `Price changed from ${item.price} to ${product.price}`,
                        warning: true,
                    });
                }
            }

            const isValid = errors.filter((e) => !e.warning).length === 0;

            return {
                success: true,
                isValid,
                errors: errors.length > 0 ? errors : undefined,
                data: cart,
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Error validating cart');
        }
    }

    // Clear cart after successful checkout (called by Order service)
    async clearCartAfterCheckout(userId: string) {
        try {
            await this.cartModel.updateOne(
                { user: userId },
                {
                    $set: {
                        items: [],
                        totalItems: 0,
                        totalPrice: 0,
                    },
                },
            );

            return { success: true };
        } catch (error) {
            // Don't throw error as this is called after order creation
            console.error('Error clearing cart after checkout:', error);
            return { success: false };
        }
    }

    // Get cart item count (for badge display)
    async getCartItemCount(userId: string) {
        try {
            const cart = await this.cartModel.findOne({ user: userId }).exec();

            const count = cart ? cart.totalItems : 0;

            return {
                success: true,
                count,
            };
        } catch (error) {
            throw new BadRequestException('Error getting cart count');
        }
    }
}