import { Controller, Post, Body, Req, UseGuards, Get } from '@nestjs/common';
import { JwtAuthGuard } from  '../auth/guards/jwt-auth.guard';
import { AddressService } from './address.service';

@Controller('address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @UseGuards(JwtAuthGuard)
  @Post('add-address')
  async addAddress(@Req() req: any, @Body() body: any) {
    const { userId } = req.user;

    return this.addressService.addAddress(userId, body);
  }

    @UseGuards(JwtAuthGuard)
  @Get('getMyAddresses')
  async getMyAddresses(@Req() req: any) {
    const { userId } = req.user;
    return this.addressService.getUserAddresses(userId);
  }

  // controller

@UseGuards(JwtAuthGuard)
@Get('getDefaultAddress')
async getDefaultAddress(@Req() req: any) {
  const { userId } = req.user;
  return this.addressService.getDefaultAddress(userId);
}

}