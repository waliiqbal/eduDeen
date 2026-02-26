import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RefundRequestDocument = HydratedDocument<RefundRequest>;

export enum RefundStatus {
    PENDING = 'pending',
    REVIEWING = 'reviewing',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

export enum RefundReason {
    MISSING_PRODUCT = 'missing',
    NOT_RECEIVED = 'not_received',
    WRONG_ITEM = 'wrong_item',
    DAMAGED = 'damaged',
    DEFECTIVE = 'defective',
    NOT_AS_DESCRIBED = 'not_as_described',
    COUNTERFEIT = 'counterfeit',
}

@Schema({ timestamps: true })
export class RefundRequest {
    _id: string;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
    order: Types.ObjectId;

    @Prop({ required: true })
    orderNumber: string;

    @Prop({ type: [Types.ObjectId], ref: 'Product', required: true })
    productIds: Types.ObjectId[]; // Products being refunded

    @Prop({ required: true })
    reason: RefundReason;

    @Prop({ trim: true })
    message?: string;

    @Prop({ type: [String], default: [] })
    images: string[]; // Cloudinary URLs

    @Prop({ required: true })
    refundAmount: number;

    @Prop({
        type: String,
        enum: Object.values(RefundStatus),
        default: RefundStatus.PENDING,
    })
    status: RefundStatus;

    @Prop({ trim: true })
    adminNote?: string; // Admin's response/note

    @Prop()
    reviewedAt?: Date;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    reviewedBy?: Types.ObjectId; // Admin who reviewed

    @Prop()
    processedAt?: Date;

    @Prop()
    completedAt?: Date;

    createdAt?: Date;
    updatedAt?: Date;
}

export const RefundRequestSchema = SchemaFactory.createForClass(RefundRequest);

// ─── Indexes ─────────────────────────────────
RefundRequestSchema.index({ user: 1 });
RefundRequestSchema.index({ order: 1 });
RefundRequestSchema.index({ status: 1 });
RefundRequestSchema.index({ createdAt: -1 });

// ─── Remove __v ──────────────────────────────
RefundRequestSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.__v;
    return obj;
};