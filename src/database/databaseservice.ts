/* eslint-disable prettier/prettier */
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as schema from "./schema";

@Injectable()
export class DatabaseService {
  constructor(
    @InjectModel(schema.User.name)
    private userModel: Model<schema.UserDocument>,
    @InjectModel(schema.User.name)
    private categoryModel: Model<schema.CategoryDocument>,
    @InjectModel(schema.User.name)
    private productModel: Model<schema.ProductDocument>,
    @InjectModel(schema.User.name)
    private orderModel: Model<schema.OrderDocument>,
    @InjectModel(schema.User.name)
    private cartModel: Model<schema.CartDocument>,
  ) { }
  get repositories() {
    return {
      userModel: this.userModel,
      categoryModel: this.categoryModel,
      productModel: this.productModel,
      orderModel: this.orderModel,
      cartModel: this.cartModel,
    };
  }
}