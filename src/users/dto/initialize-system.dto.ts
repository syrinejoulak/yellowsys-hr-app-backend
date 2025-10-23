// src/users/dto/initialize-system.dto.ts
import { IsEmail, IsString, IsNotEmpty, IsEnum, MinLength } from 'class-validator';
import { Country } from '../schemas/user.schema';

/**
 * DTO for system initialization with first HR admin
 * This DTO is used only when system is empty (first setup)
 */
export class InitializeSystemDto {
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