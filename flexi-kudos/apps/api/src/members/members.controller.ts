import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { MemberDto } from '@shared-types';
import { MembersService } from './members.service';

@SkipThrottle()
@Controller('v1/members')
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @Get()
  list(): Promise<MemberDto[]> {
    return this.members.listActive();
  }
}
