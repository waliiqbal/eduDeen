import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

// DTO for Adding Item to Cart
export class AddToCartDto {
    @ApiProperty({ example: '67a2b3c4d5e6f7g8h9i0j1k2', description: 'Product ID' })
    @IsMongoId()
    @IsNotEmpty()
    productId: string;

    @ApiProperty({ example: 2, minimum: 1, default: 1 })
    @IsNumber()
    @Min(1)
    @IsOptional()
    quantity?: number;
}

// DTO for Updating Cart Item Quantity
export class UpdateCartItemDto {
    @ApiProperty({ example: 3, minimum: 1 })
    @IsNumber()
    @Min(1)
    quantity: number;
}