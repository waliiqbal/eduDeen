import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AddressesController } from './address.controller';
import { AddressesService } from './address.service';
import { Address, AddressSchema } from './schemas/address.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Address.name, schema: AddressSchema },
        ]),
    ],
    controllers: [AddressesController],
    providers: [AddressesService],
    exports: [AddressesService, MongooseModule],
})
export class AddressesModule { }