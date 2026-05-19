import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';

import { DatabaseService } from 'src/database/databaseservice';

@Injectable()
export class PaymentService {
  constructor(
    private databaseService: DatabaseService,
  ) {}

  async addCard(userId: string, body: any) {
  const model = this.databaseService.repositories.userPaymentMethodModel;

  const { token, cardHolderName, cardBrand, cardLast4, expiryMonth, expiryYear } = body;

  const card = await model.create({
    userId,
    type: 'card',
    token,

   cardDetails: {
      holderName: cardHolderName,
      brand: cardBrand,
      last4: cardLast4,
      expiryMonth,
      expiryYear,
    },


    isDefault: false,
    status: 'active',
  });

  return {
    message: 'Card added successfully',
    data: card,
  };
}

}