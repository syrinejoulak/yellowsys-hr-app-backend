import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from './schema/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import bcrypt from 'node_modules/bcryptjs';

@Injectable()
export class UserService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<UserDocument>,
  ) {}

  async createAdmin(dto: CreateUserDto) {
    const user = await this.userModel.findOne({ email: dto.email });

    if (user) {
      throw new ConflictException('User already exists');
    }

    const hash = await bcrypt.hash(dto.password, 10);
    const createdUser = await this.userModel.create({
      ...dto,
      password: hash,
      isAdmin: true,
      isActive: true,
      firstLogin: true,
    });
    return createdUser;
  }
}
