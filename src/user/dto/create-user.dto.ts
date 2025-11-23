import { IsDate, IsEmail, IsString } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  position: string;

  @IsDate()
  hireDate: Date;

  @IsString()
  country: string;
}
