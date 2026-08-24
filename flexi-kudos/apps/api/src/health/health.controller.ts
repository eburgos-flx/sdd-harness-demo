import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Controller('healthz')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}
