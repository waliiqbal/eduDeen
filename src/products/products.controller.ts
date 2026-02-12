import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiQuery,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Products')
@Controller('api/products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    // Public Routes

    @Get()
    @ApiOperation({ summary: 'Get all products with filters and pagination' })
    @ApiResponse({
        status: 200,
        description: 'Products retrieved successfully',
    })
    findAll(@Query() query: ProductQueryDto) {
        return this.productsService.findAll(query);
    }

    @Get('featured')
    @ApiOperation({ summary: 'Get featured products' })
    @ApiResponse({
        status: 200,
        description: 'Featured products retrieved successfully',
    })
    findFeatured() {
        return this.productsService.findFeatured();
    }

    @Get('brands')
    @ApiOperation({ summary: 'Get all product brands' })
    @ApiResponse({
        status: 200,
        description: 'Brands retrieved successfully',
    })
    findAllBrands() {
        return this.productsService.findAllBrands();
    }

    @Get('category/:categoryId')
    @ApiOperation({ summary: 'Get products by category' })
    @ApiParam({ name: 'categoryId', description: 'Category ID' })
    @ApiQuery({ name: 'page', required: false, example: 1 })
    @ApiQuery({ name: 'limit', required: false, example: 10 })
    @ApiResponse({
        status: 200,
        description: 'Products retrieved successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'Category not found',
    })
    findByCategory(
        @Param('categoryId') categoryId: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.productsService.findByCategory(categoryId, page, limit);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get product by ID' })
    @ApiParam({ name: 'id', description: 'Product ID' })
    @ApiResponse({
        status: 200,
        description: 'Product retrieved successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'Product not found',
    })
    findOne(@Param('id') id: string) {
        return this.productsService.findOne(id);
    }

    // Protected Routes (Admin only)

    @Post()
    @UseGuards(JwtAuthGuard)
    // @UseGuards(JwtAuthGuard, RolesGuard)  // Uncomment when RolesGuard is ready
    // @Roles('admin')  // Uncomment when Roles decorator is ready
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create new product (Admin only)' })
    @ApiResponse({
        status: 201,
        description: 'Product created successfully',
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid data or category not found',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
    })
    @HttpCode(HttpStatus.CREATED)
    create(@Body() createProductDto: CreateProductDto) {
        return this.productsService.create(createProductDto);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    // @UseGuards(JwtAuthGuard, RolesGuard)  // Uncomment when RolesGuard is ready
    // @Roles('admin')  // Uncomment when Roles decorator is ready
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update product (Admin only)' })
    @ApiParam({ name: 'id', description: 'Product ID' })
    @ApiResponse({
        status: 200,
        description: 'Product updated successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'Product not found',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
    })
    update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
        return this.productsService.update(id, updateProductDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    // @UseGuards(JwtAuthGuard, RolesGuard)  // Uncomment when RolesGuard is ready
    // @Roles('admin')  // Uncomment when Roles decorator is ready
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete product (Admin only)' })
    @ApiParam({ name: 'id', description: 'Product ID' })
    @ApiResponse({
        status: 200,
        description: 'Product deleted successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'Product not found',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
    })
    remove(@Param('id') id: string) {
        return this.productsService.remove(id);
    }

    // Additional Admin Routes

    @Get('admin/statistics')
    @UseGuards(JwtAuthGuard)
    // @UseGuards(JwtAuthGuard, RolesGuard)  // Uncomment when RolesGuard is ready
    // @Roles('admin')  // Uncomment when Roles decorator is ready
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get product statistics (Admin only)' })
    @ApiResponse({
        status: 200,
        description: 'Statistics retrieved successfully',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
    })
    getStatistics() {
        return this.productsService.getStatistics();
    }

    @Put(':id/toggle-featured')
    @UseGuards(JwtAuthGuard)
    // @UseGuards(JwtAuthGuard, RolesGuard)  // Uncomment when RolesGuard is ready
    // @Roles('admin')  // Uncomment when Roles decorator is ready
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Toggle product featured status (Admin only)' })
    @ApiParam({ name: 'id', description: 'Product ID' })
    @ApiResponse({
        status: 200,
        description: 'Featured status toggled successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'Product not found',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
    })
    toggleFeatured(@Param('id') id: string) {
        return this.productsService.toggleFeatured(id);
    }

    @Put(':id/stock')
    @UseGuards(JwtAuthGuard)
    // @UseGuards(JwtAuthGuard, RolesGuard)  // Uncomment when RolesGuard is ready
    // @Roles('admin')  // Uncomment when Roles decorator is ready
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update product stock (Admin only)' })
    @ApiParam({ name: 'id', description: 'Product ID' })
    @ApiResponse({
        status: 200,
        description: 'Stock updated successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'Product not found',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
    })
    updateStock(@Param('id') id: string, @Body('stock') stock: number) {
        return this.productsService.updateStock(id, stock);
    }
}