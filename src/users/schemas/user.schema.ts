import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as bcrypt from 'bcryptjs';

export type UserDocument = HydratedDocument<User> & {
    comparePassword(candidatePassword: string): Promise<boolean>;
};

@Schema({ timestamps: true })
export class User {
    _id: string; // ✅ Added for TypeScript type safety

    @Prop({
        required: true,
        trim: true,
        maxlength: 50,
    })
    name: string;

    @Prop({
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    })
    email: string;

    @Prop({
        minlength: 6,
        select: false,
        required: function () {
            return !this.googleId && !this.facebookId && !this.appleId;
        },
    })
    password?: string;

    @Prop({ trim: true })
    phone?: string;

    @Prop({ trim: true })
    address?: string;

    @Prop({ default: null })
    profileImage?: string;

    @Prop({ default: null })
    googleId?: string;

    @Prop({ default: null })
    facebookId?: string;

    @Prop({ default: null })
    appleId?: string;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ default: false })
    isEmailVerified: boolean;

    createdAt?: Date;
    updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// 🔁 Hash password before saving
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password!, salt);
});

// ✅ FIXED: Compare password method properly attached to schema
UserSchema.methods.comparePassword = async function (
    candidatePassword: string,
): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

// 🔒 Remove sensitive fields from JSON
UserSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.__v;
    return obj;
};