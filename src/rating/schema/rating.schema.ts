import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReviewDocument = Review & Document;

@Schema({ timestamps: true })
export class Review {

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  productId: string;

  @Prop({ required: false })
  productVariantId: string ;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ required: false })
  comment: string;


}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// indexes
ReviewSchema.index({ productId: 1 });
ReviewSchema.index({ userId: 1 });