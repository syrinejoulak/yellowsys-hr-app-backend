import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schema/user.schema';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Creates the first admin user (handled internally by HR).
   * Passwords are hashed + salted with bcrypt before persisting anything.
   */
  async createAdmin(dto: CreateUserDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const existingUser = await this.userModel.exists({ email: normalizedEmail });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    try {
      const hashedPassword = await bcrypt.hash(dto.password, 10);
      const createdUser = await this.userModel.create({
        ...dto,
        email: normalizedEmail,
        password: hashedPassword,
        isAdmin: true,
        isActive: true,
        firstLogin: true,
      });

      return this.sanitizeUser(createdUser);
    } catch (error) {
      throw new InternalServerErrorException('Failed to create admin user');
    }
  }

  /**
   * Removes sensitive information before returning the document to controllers.
   */
  private sanitizeUser(user: UserDocument) {
    const leanUser = user.toJSON();
    delete leanUser.password;
    return leanUser;
  }
}
