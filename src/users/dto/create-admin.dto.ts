// src/users/dto/create-admin.dto.ts
import { IsEmail, IsString, IsNotEmpty, IsEnum, MinLength } from 'class-validator';
import { Country } from '../schemas/user.schema';

/**
 * DTO for creating an admin user
 * This class defines the validation rules for incoming requests
 */
export class CreateAdminDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  position: string;

  @IsEnum(Country)
  @IsNotEmpty()
  country: Country;
}