import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { Category, CategoryDocument } from '../categories/schemas/category.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';

@Injectable()
export class ProductsService {
    constructor(
        @InjectModel(Product.name)
        private productModel: Model<ProductDocument>,

        @InjectModel(Category.name)
        private categoryModel: Model<CategoryDocument>,
    ) { }

    // Get all products with filters, search, and pagination
    async findAll(queryDto: ProductQueryDto) {
        try {
            const {
                search,
                category,
                minPrice,
                maxPrice,
                brand,
                sort = 'newest',
                page = 1,
                limit = 10,
            } = queryDto;

            // Build query
            const query: any = { isActive: true };

            // Search by name, description, brand (uses text index)
            if (search) {
                query.$text = { $search: search };
            }

            // Filter by category
            if (category) {
                query.category = category;
            }

            // Filter by price range
            if (minPrice !== undefined || maxPrice !== undefined) {
                query.price = {};
                if (minPrice !== undefined) query.price.$gte = minPrice;
                if (maxPrice !== undefined) query.price.$lte = maxPrice;
            }

            // Filter by brand
            if (brand) {
                query.brand = brand;
            }

            // Sorting options
            let sortOption: any = {};
            switch (sort) {
                case 'price_asc':
                    sortOption.price = 1;
                    break;
                case 'price_desc':
                    sortOption.price = -1;
                    break;
                case 'rating':
                    sortOption['ratings.average'] = -1;
                    break;
                case 'newest':
                    sortOption.createdAt = -1;
                    break;
                case 'oldest':
                    sortOption.createdAt = 1;
                    break;
                default:
                    sortOption.createdAt = -1;
            }

            // Pagination
            const skip = (page - 1) * limit;

            // Execute query
            const [products, total] = await Promise.all([
                this.productModel
                    .find(query)
                    .populate('category', 'name')
                    .sort(sortOption)
                    .limit(limit)
                    .skip(skip)
                    .exec(),
                this.productModel.countDocuments(query).exec(),
            ]);

            return {
                success: true,
                count: products.length,
                total,
                page,
                pages: Math.ceil(total / limit),
                data: products,
            };
        } catch (error) {
            throw new BadRequestException('Error fetching products');
        }
    }

    // Get single product by ID
    async findOne(id: string) {
        try {
            const product = await this.productModel
                .findById(id)
                .populate('category', 'name description')
                .exec();

            if (!product) {
                throw new NotFoundException('Product not found');
            }

            return {
                success: true,
                data: product,
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Error fetching product');
        }
    }

    // Create new product
    async create(createProductDto: CreateProductDto) {
        try {
            // Verify category exists
            const categoryExists = await this.categoryModel
                .findById(createProductDto.category)
                .exec();

            if (!categoryExists) {
                throw new BadRequestException('Category not found');
            }

            // Create product
            const product = await this.productModel.create(createProductDto);

            // Populate category before returning
            await product.populate('category', 'name');

            return {
                success: true,
                message: 'Product created successfully',
                data: product,
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Error creating product');
        }
    }

    // Update product
    async update(id: string, updateProductDto: UpdateProductDto) {
        try {
            // If category is being updated, verify it exists
            if (updateProductDto.category) {
                const categoryExists = await this.categoryModel
                    .findById(updateProductDto.category)
                    .exec();

                if (!categoryExists) {
                    throw new BadRequestException('Category not found');
                }
            }

            const product = await this.productModel
                .findByIdAndUpdate(id, updateProductDto, {
                    new: true,
                    runValidators: true,
                })
                .populate('category', 'name')
                .exec();

            if (!product) {
                throw new NotFoundException('Product not found');
            }

            return {
                success: true,
                message: 'Product updated successfully',
                data: product,
            };
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Error updating product');
        }
    }

    // Delete product
    async remove(id: string) {
        try {
            const product = await this.productModel.findByIdAndDelete(id).exec();

            if (!product) {
                throw new NotFoundException('Product not found');
            }

            return {
                success: true,
                message: 'Product deleted successfully',
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Error deleting product');
        }
    }

    // Get featured products
    async findFeatured() {
        try {
            const products = await this.productModel
                .find({ isFeatured: true, isActive: true })
                .populate('category', 'name')
                .limit(10)
                .sort('-createdAt')
                .exec();

            return {
                success: true,
                count: products.length,
                data: products,
            };
        } catch (error) {
            throw new BadRequestException('Error fetching featured products');
        }
    }

    // Get products by category
    async findByCategory(categoryId: string, page = 1, limit = 10) {
        try {
            // Verify category exists
            const categoryExists = await this.categoryModel
                .findById(categoryId)
                .exec();

            if (!categoryExists) {
                throw new NotFoundException('Category not found');
            }

            const skip = (page - 1) * limit;

            const [products, total] = await Promise.all([
                this.productModel
                    .find({ category: categoryId, isActive: true })
                    .populate('category', 'name')
                    .limit(limit)
                    .skip(skip)
                    .sort('-createdAt')
                    .exec(),
                this.productModel
                    .countDocuments({ category: categoryId, isActive: true })
                    .exec(),
            ]);

            return {
                success: true,
                count: products.length,
                total,
                page,
                pages: Math.ceil(total / limit),
                data: products,
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Error fetching products by category');
        }
    }

    // Get all brands (for filters)
    async findAllBrands() {
        try {
            const brands = await this.productModel
                .distinct('brand')
                .where('brand')
                .ne(null)
                .ne('')
                .exec();

            return {
                success: true,
                count: brands.length,
                data: brands.sort(),
            };
        } catch (error) {
            throw new BadRequestException('Error fetching brands');
        }
    }

    // Get product statistics (Admin)
    async getStatistics() {
        try {
            const [
                totalProducts,
                activeProducts,
                featuredProducts,
                outOfStock,
                lowStock,
            ] = await Promise.all([
                this.productModel.countDocuments().exec(),
                this.productModel.countDocuments({ isActive: true }).exec(),
                this.productModel.countDocuments({ isFeatured: true }).exec(),
                this.productModel.countDocuments({ stock: 0 }).exec(),
                this.productModel.countDocuments({ stock: { $gt: 0, $lte: 10 } }).exec(),
            ]);

            return {
                success: true,
                data: {
                    totalProducts,
                    activeProducts,
                    featuredProducts,
                    outOfStock,
                    lowStock,
                },
            };
        } catch (error) {
            throw new BadRequestException('Error fetching product statistics');
        }
    }

    // Toggle featured status (Admin)
    async toggleFeatured(id: string) {
        try {
            const product = await this.productModel.findById(id).exec();

            if (!product) {
                throw new NotFoundException('Product not found');
            }

            product.isFeatured = !product.isFeatured;
            await product.save();

            return {
                success: true,
                message: `Product ${product.isFeatured ? 'featured' : 'unfeatured'} successfully`,
                data: product,
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Error toggling featured status');
        }
    }

    // Update stock (Admin)
    async updateStock(id: string, stock: number) {
        try {
            const product = await this.productModel
                .findByIdAndUpdate(
                    id,
                    { stock },
                    { new: true, runValidators: true },
                )
                .exec();

            if (!product) {
                throw new NotFoundException('Product not found');
            }

            return {
                success: true,
                message: 'Stock updated successfully',
                data: product,
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Error updating stock');
        }
    }
}