// src/users/users.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateAdminDto } from './dto/create-admin.dto';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Post('create-admin')
  @HttpCode(HttpStatus.CREATED)
  async createAdmin(@Body() createAdminDto: CreateAdminDto) {
    this.logger.log(`Creating admin user for email: ${createAdminDto.email}`);

    try {
      const createdUser = await this.usersService.createAdmin({
        email: createAdminDto.email,
        password: createAdminDto.password,
        firstName: createAdminDto.firstName,
        lastName: createAdminDto.lastName,
        position: createAdminDto.position,
        country: createAdminDto.country,
      });

      this.logger.log(`Admin user created successfully: ${createdUser.email}`);

      return {
        success: true,
        message: 'Admin user created successfully',
        data: createdUser,
      };
    } catch (error) {
      this.logger.error(`Failed to create admin user: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get()
  async findAll() {
    this.logger.log('Fetching all users');

    try {
      const users = await this.usersService.findAll();

      return {
        success: true,
        message: 'Users retrieved successfully',
        count: users.length,
        data: users,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch users: ${error.message}`, error.stack);
      throw error;
    }
  }
}