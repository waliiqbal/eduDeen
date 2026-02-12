import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, MinLength, IsNotEmpty } from 'class-validator';

export class RegisterDto {
    @ApiProperty({ example: 'Jami Raza' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'jami@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ required: false, example: '+1234567890' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({ required: false, example: 'karachi, Pakistan' })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiProperty({ example: 'Password123!', minLength: 6 })
    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    @IsNotEmpty()
    password: string;
}