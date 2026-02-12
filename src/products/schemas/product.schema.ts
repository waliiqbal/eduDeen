import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
    _id: string;

    @Prop({
        required: [true, 'Product name is required'],
        trim: true,
        maxlength: 100,
    })
    name: string;

    @Prop({
        required: [true, 'Product description is required'],
        maxlength: 1000,
    })
    description: string;

    @Prop({
        required: [true, 'Product price is required'],
        min: 0,
    })
    price: number;

    @Prop({
        type: Types.ObjectId,
        ref: 'Category',
        required: true,
    })
    category: Types.ObjectId | string;

    @Prop({
        trim: true,
    })
    brand?: string;

    @Prop({
        type: [String],
        default: [],
    })
    images: string[];

    @Prop({
        default: 0,
        min: 0,
    })
    stock: number;

    @Prop({
        default: false,
    })
    isFeatured: boolean;

    @Prop({
        default: true,
    })
    isActive: boolean;

    @Prop({
        type: {
            average: {
                type: Number,
                default: 0,
                min: 0,
                max: 5,
            },
            count: {
                type: Number,
                default: 0,
            },
        },
        _id: false,
    })
    ratings: {
        average: number;
        count: number;
    };

    createdAt?: Date;
    updatedAt?: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Text index for search - supports name, description, brand
ProductSchema.index({ name: 'text', description: 'text', brand: 'text' });

// Additional indexes for performance
ProductSchema.index({ category: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ isFeatured: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ 'ratings.average': -1 });
ProductSchema.index({ createdAt: -1 });

// Remove sensitive fields from JSON
ProductSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.__v;
    return obj;
};