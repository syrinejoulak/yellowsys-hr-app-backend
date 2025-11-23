import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Temporary guard to protect sensitive admin-only routes by checking a header-based API key.
 */
@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const providedKey = request.headers['x-admin-api-key'] as string | undefined;
    const expectedKey = this.configService.get<string>('ADMIN_CREATION_KEY');

    if (!expectedKey) {
      throw new UnauthorizedException('Admin creation key is not configured');
    }

    if (!providedKey || providedKey !== expectedKey) {
      throw new UnauthorizedException('Invalid admin API key');
    }

    return true;
  }
}
