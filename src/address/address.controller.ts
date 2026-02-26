import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
} from '@nestjs/swagger';
import { AddressesService } from './address.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/create-address.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Addresses')
@Controller('api/addresses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AddressesController {
    constructor(private readonly addressesService: AddressesService) { }

    // Create new address
    @Post()
    @ApiOperation({ summary: 'Create new address' })
    @ApiResponse({ status: 201, description: 'Address created successfully' })
    @ApiResponse({ status: 400, description: 'Invalid data' })
    @HttpCode(HttpStatus.CREATED)
    create(@Request() req, @Body() createAddressDto: CreateAddressDto) {
        return this.addressesService.create(req.user._id, createAddressDto);
    }

    // Get all addresses
    @Get()
    @ApiOperation({ summary: 'Get all user addresses' })
    @ApiResponse({ status: 200, description: 'Addresses retrieved successfully' })
    findAll(@Request() req) {
        return this.addressesService.findAll(req.user._id);
    }

    // Get address count
    @Get('count')
    @ApiOperation({ summary: 'Get address count' })
    @ApiResponse({ status: 200, description: 'Count retrieved successfully' })
    getCount(@Request() req) {
        return this.addressesService.getCount(req.user._id);
    }

    // Get default address
    @Get('default')
    @ApiOperation({ summary: 'Get default address' })
    @ApiResponse({ status: 200, description: 'Default address retrieved' })
    @ApiResponse({ status: 404, description: 'No addresses found' })
    getDefault(@Request() req) {
        return this.addressesService.getDefault(req.user._id);
    }

    // Get single address
    @Get(':id')
    @ApiOperation({ summary: 'Get address by ID' })
    @ApiParam({ name: 'id', description: 'Address ID' })
    @ApiResponse({ status: 200, description: 'Address retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Address not found' })
    findOne(@Param('id') id: string, @Request() req) {
        return this.addressesService.findOne(id, req.user._id);
    }

    // Update address
    @Put(':id')
    @ApiOperation({ summary: 'Update address' })
    @ApiParam({ name: 'id', description: 'Address ID' })
    @ApiResponse({ status: 200, description: 'Address updated successfully' })
    @ApiResponse({ status: 404, description: 'Address not found' })
    update(
        @Param('id') id: string,
        @Request() req,
        @Body() updateAddressDto: UpdateAddressDto,
    ) {
        return this.addressesService.update(id, req.user._id, updateAddressDto);
    }

    // Set as default
    @Put(':id/default')
    @ApiOperation({ summary: 'Set address as default' })
    @ApiParam({ name: 'id', description: 'Address ID' })
    @ApiResponse({ status: 200, description: 'Default address updated' })
    @ApiResponse({ status: 404, description: 'Address not found' })
    setDefault(@Param('id') id: string, @Request() req) {
        return this.addressesService.setDefault(id, req.user._id);
    }

    // Validate address
    @Get(':id/validate')
    @ApiOperation({ summary: 'Validate address' })
    @ApiParam({ name: 'id', description: 'Address ID' })
    @ApiResponse({ status: 200, description: 'Address validated' })
    @ApiResponse({ status: 404, description: 'Address not found' })
    validate(@Param('id') id: string, @Request() req) {
        return this.addressesService.validateAddress(id, req.user._id);
    }

    // Delete address (soft delete)
    @Delete(':id')
    @ApiOperation({ summary: 'Delete address' })
    @ApiParam({ name: 'id', description: 'Address ID' })
    @ApiResponse({ status: 200, description: 'Address deleted successfully' })
    @ApiResponse({ status: 404, description: 'Address not found' })
    remove(@Param('id') id: string, @Request() req) {
        return this.addressesService.remove(id, req.user._id);
    }
}