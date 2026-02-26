import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Address, AddressSchema } from '../../address/schemas/address.schema'

export type OrderDocument = HydratedDocument<Order>;

// Embedded subdocument for order items
@Schema({ _id: false })
export class OrderItem {
    @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
    product: Types.ObjectId;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true, min: 1 })
    quantity: number;

    @Prop({ required: true })
    price: number;

    @Prop()
    image?: string;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ _id: false })
export class ShippingAddress {

    @Prop({ required: true })
    fullName: string;

    @Prop({ required: true })
    phone: string;

    @Prop({ required: true })
    addressLine1: string;

    @Prop()
    addressLine2?: string;

    @Prop({ required: true })
    city: string;

    @Prop({ required: true })
    state: string;

    @Prop({ required: true })
    zipCode: string;

    @Prop({ required: true })
    country: string;
}

export const ShippingAddressSchema =
    SchemaFactory.createForClass(ShippingAddress);


// Embedded subdocument for payment result
@Schema({ _id: false })
export class PaymentResult {
    @Prop()
    id?: string;

    @Prop()
    status?: string;

    @Prop()
    updateTime?: string;

    @Prop()
    emailAddress?: string;
}

export const PaymentResultSchema = SchemaFactory.createForClass(PaymentResult);

// Main Order schema
@Schema({ timestamps: true })
export class Order {
    _id: string;



    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user: Types.ObjectId | string;

    @Prop({ type: [OrderItemSchema], required: true })
    orderItems: OrderItem[];

    @Prop({ type: ShippingAddressSchema, required: true })
    shippingAddress: ShippingAddress;

    @Prop({
        required: true,
        enum: ['cash_on_delivery', 'credit_card', 'debit_card', 'paypal', 'stripe'],
    })
    paymentMethod: string;

    @Prop({ type: PaymentResultSchema })
    paymentResult?: PaymentResult;

    @Prop({ required: true, default: 0.0 })
    itemsPrice: number;

    @Prop({ required: true, default: 0.0 })
    shippingPrice: number;

    @Prop({ required: true, default: 0.0 })
    taxPrice: number;

    @Prop({ required: true, default: 0.0 })
    totalPrice: number;

    @Prop({ required: true, default: false })
    isPaid: boolean;

    @Prop()
    paidAt?: Date;

    @Prop({ required: true, default: false })
    isDelivered: boolean;

    @Prop()
    deliveredAt?: Date;

    @Prop({
        required: true,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending',
    })
    orderStatus: string;

    createdAt?: Date;
    updatedAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Indexes for faster queries
OrderSchema.index({ user: 1 });
OrderSchema.index({ orderStatus: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ isPaid: 1 });
OrderSchema.index({ isDelivered: 1 });

// Remove __v from JSON
OrderSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.__v;
    return obj;
};