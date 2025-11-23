import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsString,
  MinLength,
} from 'class-validator';
import { Country } from '../schema/user.schema';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  position: string;

  @Type(() => Date)
  @IsDate()
  hireDate: Date;

  @IsEnum(Country)
  country: Country;
}
