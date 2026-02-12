import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    MaxLength,
    IsNumber,
    Min,
    IsMongoId,
    IsOptional,
    IsArray,
    IsUrl,
    IsBoolean,
} from 'class-validator';

export class CreateProductDto {
    @ApiProperty({
        example: 'Samsung Galaxy S24',
        description: 'Product name',
        maxLength: 100,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100, { message: 'Product name cannot exceed 100 characters' })
    name: string;

    @ApiProperty({
        example: 'Latest Samsung flagship smartphone with advanced features',
        description: 'Product description',
        maxLength: 1000,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
    description: string;

    @ApiProperty({
        example: 999.99,
        description: 'Product price',
        minimum: 0,
    })
    @IsNumber()
    @Min(0, { message: 'Price must be a positive number' })
    price: number;

    @ApiProperty({
        example: '67a1b2c3d4e5f6g7h8i9j0k1',
        description: 'Category ID',
    })
    @IsMongoId({ message: 'Invalid category ID' })
    @IsNotEmpty()
    category: string;

    @ApiProperty({
        required: false,
        example: 'Samsung',
        description: 'Product brand',
    })
    @IsOptional()
    @IsString()
    brand?: string;

    @ApiProperty({
        required: false,
        example: [
            'https://example.com/images/product1.jpg',
            'https://example.com/images/product2.jpg',
        ],
        description: 'Array of product image URLs',
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsUrl({}, { each: true, message: 'Each image must be a valid URL' })
    images?: string[];

    @ApiProperty({
        required: false,
        example: 50,
        description: 'Stock quantity',
        minimum: 0,
        default: 0,
    })
    @IsOptional()
    @IsNumber()
    @Min(0, { message: 'Stock must be a non-negative number' })
    stock?: number;

    @ApiProperty({
        required: false,
        example: false,
        description: 'Is product featured',
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean;

    @ApiProperty({
        required: false,
        example: true,
        description: 'Is product active',
        default: true,
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}