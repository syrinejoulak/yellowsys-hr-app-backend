import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';
import { AdminApiKeyGuard } from '../auth/guards/admin-api-key.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * HR-only endpoint to bootstrap the very first admin account.
   * Protected by a simple API-key guard until full auth is in place.
   */
  @UseGuards(AdminApiKeyGuard)
  @Post('admin')
  async createAdmin(@Body() dto: CreateUserDto) {
    return this.userService.createAdmin(dto);
  }
}
