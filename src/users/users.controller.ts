// src/users/users.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  ConflictException,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthService } from './auth.service';
import { InitializeSystemDto } from './dto/initialize-system.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Initialize system with first HR admin (only works if system is empty)
   * This endpoint can only be used once when the system is first set up
   */
  @Post('initialize')
  @HttpCode(HttpStatus.CREATED)
  async initializeSystem(@Body() initializeSystemDto: InitializeSystemDto) {
    this.logger.log(`Attempting to initialize system with email: ${initializeSystemDto.email}`);

    try {
      const createdUser = await this.usersService.initializeSystem({
        email: initializeSystemDto.email,
        password: initializeSystemDto.password,
        firstName: initializeSystemDto.firstName,
        lastName: initializeSystemDto.lastName,
        position: initializeSystemDto.position,
        country: initializeSystemDto.country,
      });

      this.logger.log(`System initialized successfully with HR admin: ${createdUser.email}`);

      return {
        success: true,
        message: 'System initialized successfully with HR admin',
        data: createdUser,
      };
    } catch (error) {
      this.logger.error(`Failed to initialize system: ${error.message}`, error.stack);

      if (error instanceof ConflictException) {
        throw new ConflictException('System is already initialized. Use login endpoint instead.');
      }
      throw error;
    }
  }

  /**
   * Create a new user (HR admin only)
   * Protected endpoint - only authenticated admins can create users
   * Generates random password and prepares email reset token
   */
  @Post('create')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() createUserDto: CreateUserDto) {
    this.logger.log(`Creating new user for email: ${createUserDto.email}`);

    try {
      const { user, generatedPassword } = await this.usersService.createUser({
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        position: createUserDto.position,
        country: createUserDto.country,
      });

      // Generate password reset token for email
      const resetToken = await this.authService.requestPasswordReset(user.email);

      this.logger.log(`User created successfully: ${user.email}`);

      const responseData: any = {
        user,
        generatedPassword, // For development/testing - remove in production
      };

      if (resetToken) {
        responseData.resetToken = resetToken; // For development/testing - remove in production
      }

      return {
        success: true,
        message: 'User created successfully. Password reset email sent.',
        data: responseData,
      };
    } catch (error) {
      this.logger.error(`Failed to create user: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Legacy endpoint - kept for compatibility but should not be used
   * @deprecated Use initialize-system endpoint instead
   */
  @Post('create-admin')
  @HttpCode(HttpStatus.CREATED)
  async createAdmin(@Body() createAdminDto: CreateAdminDto) {
    this.logger.warn(`Legacy create-admin endpoint used for email: ${createAdminDto.email}. Use initialize endpoint instead.`);

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
  @UseGuards(JwtAuthGuard)
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