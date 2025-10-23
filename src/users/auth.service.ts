// src/users/auth.service.ts
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from './users.service';
import * as bcrypt from 'bcryptjs';
import { UserDocument } from './schemas/user.schema';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Login user and return JWT token
   * Check if user exists, is active, and password is correct
   *
   * @param email - User email
   * @param password - Plain text password
   * @returns Object with access token and user info
   */
  async login(email: string, password: string) {
    this.logger.log(`Login attempt for email: ${email}`);

    // Find user by email
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      this.logger.warn(`User not found: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active (if inactive, cannot login)
    if (!user.isActive) {
      this.logger.warn(`User is inactive: ${email}`);
      throw new UnauthorizedException('Account is inactive');
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`Invalid password for user: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Create JWT payload
    const payload = {
      sub: user._id,
      email: user.email,
      isAdmin: user.isAdmin,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    // Generate JWT token
    const accessToken = this.jwtService.sign(payload);

    this.logger.log(`User logged in successfully: ${email}`);

    // Return token and user info (password is excluded by schema toJSON transform)
    return {
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        position: user.position,
        country: user.country,
        isAdmin: user.isAdmin,
        isActive: user.isActive,
        firstLogin: user.firstLogin,
        hireDate: user.hireDate,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  /**
   * Change user password (when user is logged in and knows current password)
   *
   * @param userId - User ID
   * @param currentPassword - Current password
   * @param newPassword - New password
   * @returns Updated user document
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<UserDocument> {
    this.logger.log(`Password change request for user ID: ${userId}`);

    // Find user
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and firstLogin flag
    user.password = hashedNewPassword;
    user.firstLogin = false;
    await user.save();

    this.logger.log(`Password changed successfully for user ID: ${userId}`);
    return user;
  }

  /**
   * Request password reset (when user forgot password)
   * Generate reset token
   *
   * @param email - User email
   * @returns Reset token or null if user doesn't exist
   */
  async requestPasswordReset(email: string): Promise<string | null> {
    this.logger.log(`Password reset request for email: ${email}`);

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not for security
      return null;
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = this.jwtService.sign(
      { sub: user._id, type: 'password-reset' },
      { expiresIn: '1h' },
    );

    this.logger.log(`Password reset token generated for user: ${email}`);

    // In a real application, you would send this token via email
    return resetToken;
  }

  /**
   * Reset password using reset token (following forgot password request)
   *
   * @param resetToken - Reset token
   * @param newPassword - New password
   * @returns Success status
   */
  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    this.logger.log(`Password reset attempt with token`);

    try {
      // Verify reset token
      const payload = this.jwtService.verify(resetToken);

      if (payload.type !== 'password-reset') {
        throw new UnauthorizedException('Invalid reset token');
      }

      // Find user
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Hash new password
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      user.password = hashedNewPassword;
      user.firstLogin = false;
      await user.save();

      this.logger.log(`Password reset successful for user ID: ${user._id}`);
    } catch (error) {
      this.logger.warn(`Password reset failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired reset token');
    }
  }
}
