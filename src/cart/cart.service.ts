import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';

import { DatabaseService } from 'src/database/databaseservice';
;

@Injectable()
export class CartService {
 constructor(private readonly databaseService: DatabaseService) {}
// async addCart(
//   sellerId: string,
//   role: string,

// ) {
//   try {

//     const cartModel = this.databaseService.repositories.cartModel;

//     // ADMIN CHECK
//     if (role === 'admin') {

//       const admin = await this.databaseService.repositories.adminModel.findOne({
//         _id: sellerId,
//         status: 'active',
//         isDelete: false
//       });

//       if (!admin) {
//         throw new UnauthorizedException('Unauthorized admin');
//       }

//     }

//     // SELLER CHECK
//     if (role === 'seller') {

//       const seller = await this.databaseService.repositories.sellerModel.findOne({
//         _id: sellerId,
//         status: 'active',
//         isDelete: false
//       });

//       if (!seller) {
//         throw new UnauthorizedException('Unauthorized seller');
//       }

//     }

//     const {
//       name,
//       slug,
//       description,
//       categoryId,
//       images
//     } = createProductDto;

//     // check duplicate product for same seller
//     const existingProduct = await productModel.findOne({
//       name,
//       slug,
//       categoryId,
//       sellerId,
//       status: 'active',
//       isDelete: false
//     });

//     if (existingProduct) {
//       throw new BadRequestException('Product already exists');
//     }

//     const product = await productModel.create({
//       name,
//       slug,
//       description: description ,
//       sellerId,
//       categoryId,
//       images: images || []
//     });

//     return {
//       message: 'Product created successfully',
//       data: product
//     };

//   } catch (error) {

//     throw new BadRequestException(
//       error.message || 'Failed to create product'
//     );

//   }
// }

}