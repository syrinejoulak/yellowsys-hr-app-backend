// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from '../users/auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';

// DTOs for authentication
export class LoginDto {
  email: string;
  password: string;
}

export class ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export class RequestPasswordResetDto {
  email: string;
}

export class ResetPasswordDto {
  token: string;
  newPassword: string;
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  /**
   * Login endpoint - generates JWT token
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    this.logger.log(`Login attempt for email: ${loginDto.email}`);

    try {
      const result = await this.authService.login(loginDto.email, loginDto.password);

      return {
        success: true,
        message: 'Login successful',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Login failed for email ${loginDto.email}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Change password endpoint - requires authentication
   */
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    const userId = req.user.id;
    this.logger.log(`Password change request for user ID: ${userId}`);

    try {
      const updatedUser = await this.authService.changePassword(
        userId,
        changePasswordDto.currentPassword,
        changePasswordDto.newPassword,
      );

      return {
        success: true,
        message: 'Password changed successfully',
        data: {
          id: updatedUser._id,
          email: updatedUser.email,
          firstLogin: updatedUser.firstLogin,
        },
      };
    } catch (error) {
      this.logger.error(`Password change failed for user ID ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Request password reset - generates reset token
   */
  @Post('request-password-reset')
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(@Body() requestPasswordResetDto: RequestPasswordResetDto) {
    this.logger.log(`Password reset request for email: ${requestPasswordResetDto.email}`);

    try {
      const resetToken = await this.authService.requestPasswordReset(
        requestPasswordResetDto.email,
      );

      return {
        success: true,
        message: resetToken
          ? 'Password reset token generated'
          : 'If the email exists, a reset token has been generated',
        data: resetToken ? {
          resetToken, // In production, this should be sent via email
        } : {},
      };
    } catch (error) {
      this.logger.error(
        `Password reset request failed for email ${requestPasswordResetDto.email}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Reset password using token
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    this.logger.log('Password reset attempt with token');

    try {
      await this.authService.resetPassword(
        resetPasswordDto.token,
        resetPasswordDto.newPassword,
      );

      return {
        success: true,
        message: 'Password reset successful',
      };
    } catch (error) {
      this.logger.error(`Password reset failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get current user profile - requires authentication
   */
  @Post('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getProfile(@Request() req) {
    const user = req.user;

    return {
      success: true,
      message: 'Profile retrieved successfully',
      data: user,
    };
  }
}