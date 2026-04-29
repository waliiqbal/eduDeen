import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';

import { DatabaseService } from 'src/database/databaseservice';
;
import { AddToCartDto } from './dto/add-to-cart.dto';



@Injectable()
export class CartService {
 constructor(private readonly databaseService: DatabaseService) {}
async addToCart(userId: string, dto: AddToCartDto) {
  try {
    // 1. find cart
    let cart = await this.databaseService.repositories.cartModel.findOne({ userId, isDelete: false });

    // 2. if no cart → create new
    if (!cart) {
      cart = await this.databaseService.repositories.cartModel.create({
        userId,
        items: [
          {
            productId: dto.productId,
            productVariantId: dto.productVariantId,
            name: dto.name,
            quantity: dto.quantity || 1,
            price: dto.price,
            image: dto.image,
          },
        ],
      });

      return {
        message: 'Cart created and product added successfully',
        data: cart,
      };
    }

    // 3. check existing item
    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.productId === dto.productId &&
        item.productVariantId === dto.productVariantId,
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += dto.quantity || 1;
    } else {
      cart.items.push({
        productId: dto.productId,
        productVariantId: dto.productVariantId,
        name: dto.name,
        quantity: dto.quantity || 1,
        price: dto.price,
        image: dto.image,
      } as any);
    }

 

    await cart.save();

    return {
      message: 'Product added to cart successfully',
      data: cart,
    };

  } catch (error: any) {
    throw new BadRequestException(
      error.message || 'Failed to add product to cart',
    );
  }
}

async getCart(userId: string) {
  try {
    const cart = await this.databaseService.repositories.cartModel.findOne({
      userId,
      isDelete: false,
    });

    if (!cart) {
      return {
        message: 'Cart is empty',
        data: {
          items: [],
          totalPrice: 0,
          totalItems: 0,
        },
      };
    }

    let totalPrice = 0;
    let totalItems = 0;

    const items = cart.items.map((item) => {
      const itemTotal = item.price * item.quantity;

      totalPrice += itemTotal;
      totalItems += item.quantity;

      return {
        productId: item.productId,
        productVariantId: item.productVariantId,
        name: item.name,
        image: item.image,

        unitPrice: item.price,          // single item price
        quantity: item.quantity,        // kitni quantity hai
        itemTotal: itemTotal,           // price × quantity
      };
    });

    return {
      message: 'Cart fetched successfully',
      data: {
        items,
        totalItems,
        totalPrice,
      },
    };
  } catch (error: any) {
    throw new BadRequestException(
      error.message || 'Failed to fetch cart',
    );
  }
}

async addToWishlist(userId: string, body: any) {
  try {
    const { productId, productVariantId } = body;

    // 1. check duplicate
    let wishlistItem = await this.databaseService.repositories.wishListModel.findOne({
      userId,
      productId,
      productVariantId,
    });

    if (wishlistItem) {
      // 👉 product + variant fetch
      const product = await this.databaseService.repositories.productModel.findById(productId);
      const variant = await this.databaseService.repositories.productVariantModel.findById(productVariantId);

      return {
        message: 'Product already in wishlist',
        data: {
          wishlist: wishlistItem,
          product,
          variant,
        },
      };
    }

    // 2. create wishlist
    const newItem = await this.databaseService.repositories.wishListModel.create({
      userId,
      productId,
      productVariantId,
    });

    await this.databaseService.repositories.productModel.findByIdAndUpdate(
  productId,
  {
    $inc: { wishlistCount: 1 },
    lastWishlistedAt: new Date(),
  }
);

    // 3. fetch product + variant
    const product = await this.databaseService.repositories.productModel.findById(productId);
    const variant = await this.databaseService.repositories.productVariantModel.findById(productVariantId);

    // 4. final response
    return {
      message: 'Product added to wishlist successfully',
      data: {
        wishlist: newItem,
        product,
        variant,
      },
    };

  } catch (error: any) {
    throw new BadRequestException(
      error.message || 'Failed to add to wishlist',
    );
  }
}

async getWishlist(userId: string) {
  try {
    const wishlist = await this.databaseService.repositories.wishListModel.aggregate([
      
      // 1. match user wishlist
      {
        $match: {
          userId: userId,
        },
      },

      // 2. product join (FULL DOCUMENT)
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product',
        },
      },

      {
        $unwind: {
          path: '$product',
          preserveNullAndEmptyArrays: true,
        },
      },

      // 3. variant join (FULL DOCUMENT)
      {
        $lookup: {
          from: 'productvariants',
          localField: 'productVariantId',
          foreignField: '_id',
          as: 'variant',
        },
      },

      {
        $unwind: {
          path: '$variant',
          preserveNullAndEmptyArrays: true,
        },
      },

      // 4. sort latest first
      {
        $sort: { createdAt: -1 },
      },
    ]);

    return {
      message: 'Wishlist fetched successfully',
      data: wishlist,
    };

  } catch (error: any) {
    throw new BadRequestException(
      error.message || 'Failed to fetch wishlist',
    );
  }
}

async getWishlistItem(userId: string, query: any) {
  try {
    const { productId, productVariantId } = query;

    // 1. wishlist document find
    const wishlistItem = await this.databaseService.repositories.wishListModel.findOne({
      userId,
      productId,
      productVariantId

    });

    if (!wishlistItem) {
      return {
        message: 'Wishlist item not found',
        data: null,
      };
    }

    // 2. product fetch
    const product = await this.databaseService.repositories.productModel.findById(productId);

    // 3. variant fetch
    const variant = await this.databaseService.repositories.productVariantModel.findById(productVariantId);

    return {
      message: 'Wishlist item fetched successfully',
      data: {
        wishlist: wishlistItem,
        product,
        variant,
      },
    };

  } catch (error: any) {
    throw new BadRequestException(
      error.message || 'Failed to fetch wishlist item',
    );
  }
}

async removeFromWishlist(wishlistId: string) {
  try {
    // 1. find wishlist item
    const wishlistItem =
      await this.databaseService.repositories.wishListModel.findById(wishlistId);

    if (!wishlistItem) {
      throw new BadRequestException('Wishlist item not found');
    }

    // 2. delete wishlist item
    await this.databaseService.repositories.wishListModel.findByIdAndDelete(
      wishlistId,
    );

    // 3. decrease wishlist count in product
    await this.databaseService.repositories.productModel.findByIdAndUpdate(
      wishlistItem.productId,
      {
        $inc: { wishlistCount: -1 },
      },
    );

    return {
      message: 'Product removed from wishlist successfully',
      data: {
        removedWishlistId: wishlistId,
        productId: wishlistItem.productId,
      },
    };

  } catch (error: any) {
    throw new BadRequestException(
      error.message || 'Failed to remove from wishlist',
    );
  }
}

}