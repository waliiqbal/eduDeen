/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  sellerId: string;

  @Prop({ type: String, unique: true })
  slug: string;

  @Prop({ type: String,  default: null })
  description: string | null;

  @Prop({ type: String, required: true })
  categoryId: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  // analytics
  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: 0 })
  wishlistCount: number;

  @Prop({ default: 0 })
  purchaseCount: number;

  @Prop({ default: 0 })
  averageRating: number;

  @Prop({ default: 0 })
  totalRatings: number;

  @Prop({ type: Date, default: null })
  lastViewedAt: Date | null;

  @Prop({ type: Date, default: null })
  lastPurchasedAt: Date | null;

  @Prop({  type: Date,default: null })
  lastWishlistedAt: Date | null;

  @Prop({ enum: ['active', 'inactive'], default: 'active' })
  status: string;

  @Prop({ default: false })
  isDelete: boolean;

}

export const ProductSchema = SchemaFactory.createForClass(Product);

// indexes
ProductSchema.index({ name: 1 });
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ purchaseCount: -1 });
ProductSchema.index({ viewCount: -1 });