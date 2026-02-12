import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order, OrderSchema } from './schemas/order.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { CartModule } from '../cart/cart.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Order.name, schema: OrderSchema },
            { name: Product.name, schema: ProductSchema },
        ]),
        forwardRef(() => CartModule),
    ],
    controllers: [OrdersController],
    providers: [OrdersService],
    exports: [OrdersService, MongooseModule],
})
export class OrdersModule { }