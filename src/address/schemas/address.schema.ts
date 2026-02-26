import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AddressDocument = HydratedDocument<Address>;

@Schema({ timestamps: true })
export class Address {
    _id: string;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user: Types.ObjectId | string;

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

    @Prop({ default: false })
    isDefault: boolean;

    @Prop({
        enum: ['home', 'work', 'other'],
        default: 'home',
    })
    type: string;

    @Prop()
    label?: string;

    @Prop({ default: true })
    isActive: boolean;

    createdAt?: Date;
    updatedAt?: Date;
}

export const AddressSchema = SchemaFactory.createForClass(Address);

// Indexes
AddressSchema.index({ user: 1 });
AddressSchema.index({ user: 1, isDefault: 1 });
AddressSchema.index({ isActive: 1 });

AddressSchema.virtual('fullAddress').get(function () {
    return [
        this.addressLine1,
        this.addressLine2,
        this.city,
        this.state,
        this.zipCode,
        this.country,
    ]
        .filter(Boolean)
        .join(', ');
});

AddressSchema.methods.toShippingAddress = function () {
    return {
        fullName: this.fullName,
        phone: this.phone,
        addressLine1: this.addressLine1,
        addressLine2: this.addressLine2,
        city: this.city,
        state: this.state,
        zipCode: this.zipCode,
        country: this.country,
    };
};

AddressSchema.methods.toJSON = function () {
    const obj = this.toObject({ virtuals: true });
    delete obj.__v;
    return obj;
};
