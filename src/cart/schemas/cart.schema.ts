import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CartDocument = HydratedDocument<Cart> & {
    updateTotals(): void;
};
// Embedded subdocument for cart items
@Schema({ _id: false })
export class CartItem {
    @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
    product: Types.ObjectId | String;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true, min: 1 })
    quantity: number;

    @Prop({ required: true })
    price: number;

    @Prop()
    image?: string;

    @Prop()
    brand?: string;

    @Prop({ default: Date.now })
    addedAt: Date;
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);

// Main Cart schema
@Schema({ timestamps: true })
export class Cart {
    _id: string;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
    user: Types.ObjectId | string;

    @Prop({ type: [CartItemSchema], default: [] })
    items: CartItem[];

    @Prop({ default: 0 })
    totalItems: number;

    @Prop({ default: 0 })
    totalPrice: number;

    createdAt?: Date;
    updatedAt?: Date;
}

export const CartSchema = SchemaFactory.createForClass(Cart);

// Index for faster queries
CartSchema.index({ user: 1 });

// Virtual for calculating totals
CartSchema.virtual('itemCount').get(function () {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

CartSchema.virtual('subtotal').get(function () {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

// Method to update totals
CartSchema.methods.updateTotals = function () {
    this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
    this.totalPrice = this.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
    );
};

// Remove __v from JSON
CartSchema.methods.toJSON = function () {
    const obj = this.toObject({ virtuals: true });
    delete obj.__v;
    return obj;
};