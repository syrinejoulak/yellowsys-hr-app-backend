// src/users/users.service.ts
import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  // Inject User model for database operations
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Create a new admin user
   * This method is simple: just creates a user with basic validation
   *
   * @param userData - User data including email, password, firstName, lastName, position
   * @returns Created user document without password
   */
  async createAdmin(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    position: string;
    country: 'France' | 'Tunisia';
  }): Promise<UserDocument> {
    this.logger.log(`Creating admin user with email: ${userData.email}`);

    // Check if user already exists by email
    const existingUser = await this.userModel.findOne({
      email: userData.email,
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash the password for security
    const saltRounds = 10; // Standard salt rounds for bcrypt
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    // Create new user with admin privileges
    const newUser = new this.userModel({
      ...userData,
      password: hashedPassword,
      isAdmin: true, // Set admin role
      isActive: true, // User is active by default
      firstLogin: true, // User should change password on first login
      hireDate: new Date(), // Set current date as hire date
    });

    // Save user to database
    const savedUser = await newUser.save();

    this.logger.log(
      `Admin user created successfully with ID: ${savedUser._id}`,
    );

    // Return user without password (handled by schema toJSON transform)
    return savedUser;
  }

  /**
   * Find user by email (for future authentication logic)
   *
   * @param email - User email
   * @returns User document or null
   */
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  /**
   * Find user by ID (for future user management)
   *
   * @param id - User ID
   * @returns User document or null
   */
  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  /**
   * Check if system is already initialized (has any users)
   *
   * @returns boolean - true if system has users, false if empty
   */
  async isSystemInitialized(): Promise<boolean> {
    const userCount = await this.userModel.countDocuments().exec();
    return userCount > 0;
  }

  /**
   * Initialize system with first HR admin (only works if system is empty)
   *
   * @param userData - HR admin data
   * @returns Created HR admin user
   */
  async initializeSystem(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    position: string;
    country: 'France' | 'Tunisia';
  }): Promise<UserDocument> {
    this.logger.log('Attempting to initialize system with first HR admin');

    // Check if system already has users
    const isInitialized = await this.isSystemInitialized();
    if (isInitialized) {
      throw new ConflictException('System is already initialized');
    }

    // Create HR admin using existing createAdmin method
    return this.createAdmin(userData);
  }

  /**
   * Create a new user (HR admin only)
   * Generates random password and sends email reset token
   *
   * @param userData - User data (without password)
   * @returns Created user with generated password info
   */
  async createUser(userData: {
    email: string;
    firstName: string;
    lastName: string;
    position: string;
    country: 'France' | 'Tunisia';
  }): Promise<{ user: UserDocument; generatedPassword: string }> {
    this.logger.log(`Creating new user with email: ${userData.email}`);

    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      email: userData.email,
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Generate random password
    const generatedPassword = this.generateRandomPassword();
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(generatedPassword, saltRounds);

    // Create new user
    const newUser = new this.userModel({
      ...userData,
      password: hashedPassword,
      isAdmin: false, // Regular user, not admin
      isActive: true,
      firstLogin: true, // Must change password on first login
      hireDate: new Date(),
    });

    const savedUser = await newUser.save();
    this.logger.log(`User created successfully with ID: ${savedUser._id}`);

    return { user: savedUser, generatedPassword };
  }

  /**
   * Generate random password for new users
   *
   * @returns Random password string
   */
  private generateRandomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Get all users (for admin dashboard)
   *
   * @returns Array of all users
   */
  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().sort({ createdAt: -1 }).exec();
  }
}
