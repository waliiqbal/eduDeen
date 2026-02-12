import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
    constructor(
        @InjectModel(Category.name)
        private categoryModel: Model<CategoryDocument>,

        // Note: Product model will be injected when you create the Product module
        // @InjectModel(Product.name)
        // private productModel: Model<ProductDocument>,
    ) { }

    // Get all active categories
    async findAll() {
        try {
            const categories = await this.categoryModel
                .find({ isActive: true })
                .sort('name')
                .exec();

            return {
                success: true,
                count: categories.length,
                data: categories,
            };
        } catch (error) {
            throw new BadRequestException('Error fetching categories');
        }
    }

    // Get single category by ID
    async findOne(id: string) {
        try {
            const category = await this.categoryModel.findById(id).exec();

            if (!category) {
                throw new NotFoundException('Category not found');
            }

            return {
                success: true,
                data: category,
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Error fetching category');
        }
    }

    // Create new category
    async create(createCategoryDto: CreateCategoryDto) {
        try {
            // Check if category already exists
            const categoryExists = await this.categoryModel
                .findOne({ name: createCategoryDto.name })
                .exec();

            if (categoryExists) {
                throw new ConflictException('Category already exists');
            }

            const category = await this.categoryModel.create(createCategoryDto);

            return {
                success: true,
                message: 'Category created successfully',
                data: category,
            };
        } catch (error) {
            if (error instanceof ConflictException) {
                throw error;
            }
            throw new BadRequestException('Error creating category');
        }
    }

    // Update category
    async update(id: string, updateCategoryDto: UpdateCategoryDto) {
        try {
            // If updating name, check for duplicates
            if (updateCategoryDto.name) {
                const duplicate = await this.categoryModel
                    .findOne({
                        name: updateCategoryDto.name,
                        _id: { $ne: id } // Exclude current category
                    })
                    .exec();

                if (duplicate) {
                    throw new ConflictException('Category name already exists');
                }
            }

            const category = await this.categoryModel
                .findByIdAndUpdate(id, updateCategoryDto, {
                    new: true,
                    runValidators: true,
                })
                .exec();

            if (!category) {
                throw new NotFoundException('Category not found');
            }

            return {
                success: true,
                message: 'Category updated successfully',
                data: category,
            };
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof ConflictException) {
                throw error;
            }
            throw new BadRequestException('Error updating category');
        }
    }

    // Delete category
    async remove(id: string) {
        try {
            // TODO: Uncomment when Product module is ready
            // Check if category has products
            // const productsCount = await this.productModel
            //     .countDocuments({ category: id })
            //     .exec();

            // if (productsCount > 0) {
            //     throw new BadRequestException(
            //         `Cannot delete category. It has ${productsCount} products associated with it.`
            //     );
            // }

            const category = await this.categoryModel
                .findByIdAndDelete(id)
                .exec();

            if (!category) {
                throw new NotFoundException('Category not found');
            }

            return {
                success: true,
                message: 'Category deleted successfully',
            };
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Error deleting category');
        }
    }

    // Get all categories (including inactive) - Admin only
    async findAllAdmin() {
        try {
            const categories = await this.categoryModel
                .find()
                .sort('name')
                .exec();

            return {
                success: true,
                count: categories.length,
                data: categories,
            };
        } catch (error) {
            throw new BadRequestException('Error fetching categories');
        }
    }

    // Toggle category active status - Admin only
    async toggleActive(id: string) {
        try {
            const category = await this.categoryModel.findById(id).exec();

            if (!category) {
                throw new NotFoundException('Category not found');
            }

            category.isActive = !category.isActive;
            await category.save();

            return {
                success: true,
                message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
                data: category,
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Error toggling category status');
        }
    }
}