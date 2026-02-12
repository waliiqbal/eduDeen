import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: true })
export class Category {
    _id: string;

    @Prop({
        required: [true, 'Please provide category name'],
        trim: true,
        unique: true,
        maxlength: [50, 'Category name cannot be more than 50 characters'],
    })
    name: string;

    @Prop({
        trim: true,
        maxlength: [500, 'Description cannot be more than 500 characters'],
    })
    description?: string;

    @Prop({
        default: null,
    })
    image?: string;

    @Prop({
        default: true,
    })
    isActive: boolean;

    createdAt?: Date;
    updatedAt?: Date;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Create indexes
CategorySchema.index({ name: 1 });
CategorySchema.index({ isActive: 1 });

// Remove sensitive fields from JSON
CategorySchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.__v;
    return obj;
};