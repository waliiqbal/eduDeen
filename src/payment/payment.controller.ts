import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Req,
    Query
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator'
import { RolesGuard } from '../auth/guards/roles.guard'; 
import { PaymentService } from './payment.service';


@Controller('api/payment')
export class PaymentController {
    constructor(private readonly PaymentService: PaymentService) { }

    @UseGuards(JwtAuthGuard)
@Post('add-card')
async addCard(@Req() req: any, @Body() body: any) {
  const userId = req.user.userId;

  return this.PaymentService.addCard(userId, body);
}


}