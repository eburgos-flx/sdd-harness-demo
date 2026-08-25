import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import type { KudoDto, KudoListResponse } from '@shared-types';
import { CreateKudoDto } from './dto/create-kudo.dto';
import { ListKudosQuery } from './dto/list-kudos.query';
import { KudosService } from './kudos.service';

@Controller('v1/kudos')
export class KudosController {
  constructor(private readonly kudos: KudosService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  create(@Body() dto: CreateKudoDto): Promise<KudoDto> {
    return this.kudos.create({
      giver_id: dto.giver_id,
      receiver_id: dto.receiver_id,
      category: dto.category as KudoDto['category']['key'],
      message: dto.message,
    });
  }

  @Get()
  @SkipThrottle()
  list(@Query() query: ListKudosQuery): Promise<KudoListResponse> {
    const secret = process.env['CURSOR_SECRET'] ?? 'change-me-in-production';
    return this.kudos.list(query.limit, query.cursor, secret);
  }
}
