import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
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
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Categories')
@Controller('api/categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    // Public Routes

    @Get()
    @ApiOperation({ summary: 'Get all active categories' })
    @ApiResponse({
        status: 200,
        description: 'Categories retrieved successfully'
    })
    findAll() {
        return this.categoriesService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get category by ID' })
    @ApiParam({ name: 'id', description: 'Category ID' })
    @ApiResponse({
        status: 200,
        description: 'Category retrieved successfully'
    })
    @ApiResponse({
        status: 404,
        description: 'Category not found'
    })
    findOne(@Param('id') id: string) {
        return this.categoriesService.findOne(id);
    }

    // Protected Routes (Admin only)

    @Post()
    @UseGuards(JwtAuthGuard)
    // @UseGuards(JwtAuthGuard, RolesGuard)  // Uncomment when RolesGuard is ready
    // @Roles('admin')  // Uncomment when Roles decorator is ready
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create new category (Admin only)' })
    @ApiResponse({
        status: 201,
        description: 'Category created successfully'
    })
    @ApiResponse({
        status: 400,
        description: 'Category already exists'
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized'
    })
    @HttpCode(HttpStatus.CREATED)
    create(@Body() createCategoryDto: CreateCategoryDto) {
        return this.categoriesService.create(createCategoryDto);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    // @UseGuards(JwtAuthGuard, RolesGuard)  // Uncomment when RolesGuard is ready
    // @Roles('admin')  // Uncomment when Roles decorator is ready
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update category (Admin only)' })
    @ApiParam({ name: 'id', description: 'Category ID' })
    @ApiResponse({
        status: 200,
        description: 'Category updated successfully'
    })
    @ApiResponse({
        status: 404,
        description: 'Category not found'
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized'
    })
    update(
        @Param('id') id: string,
        @Body() updateCategoryDto: UpdateCategoryDto,
    ) {
        return this.categoriesService.update(id, updateCategoryDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    // @UseGuards(JwtAuthGuard, RolesGuard)  // Uncomment when RolesGuard is ready
    // @Roles('admin')  // Uncomment when Roles decorator is ready
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete category (Admin only)' })
    @ApiParam({ name: 'id', description: 'Category ID' })
    @ApiResponse({
        status: 200,
        description: 'Category deleted successfully'
    })
    @ApiResponse({
        status: 400,
        description: 'Cannot delete category with associated products'
    })
    @ApiResponse({
        status: 404,
        description: 'Category not found'
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized'
    })
    remove(@Param('id') id: string) {
        return this.categoriesService.remove(id);
    }

    // Additional Admin Routes

    @Get('admin/all')
    @UseGuards(JwtAuthGuard)
    // @UseGuards(JwtAuthGuard, RolesGuard)  // Uncomment when RolesGuard is ready
    // @Roles('admin')  // Uncomment when Roles decorator is ready
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all categories including inactive (Admin only)' })
    @ApiResponse({
        status: 200,
        description: 'All categories retrieved successfully'
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized'
    })
    findAllAdmin() {
        return this.categoriesService.findAllAdmin();
    }

    @Put(':id/toggle-active')
    @UseGuards(JwtAuthGuard)
    // @UseGuards(JwtAuthGuard, RolesGuard)  // Uncomment when RolesGuard is ready
    // @Roles('admin')  // Uncomment when Roles decorator is ready
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Toggle category active status (Admin only)' })
    @ApiParam({ name: 'id', description: 'Category ID' })
    @ApiResponse({
        status: 200,
        description: 'Category status toggled successfully'
    })
    @ApiResponse({
        status: 404,
        description: 'Category not found'
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized'
    })
    toggleActive(@Param('id') id: string) {
        return this.categoriesService.toggleActive(id);
    }
}