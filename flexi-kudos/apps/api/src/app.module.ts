import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { CategoriesModule } from './categories/categories.module';
import { HealthModule } from './health/health.module';
import { KudosModule } from './kudos/kudos.module';
import { MembersModule } from './members/members.module';
import { PrismaModule } from './prisma/prisma.module';

const RATE_LIMIT_TTL_MS = Number(process.env['RATE_LIMIT_TTL_MS'] ?? 60_000);
const RATE_LIMIT_MAX = Number(process.env['RATE_LIMIT_MAX'] ?? 60);

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        genReqId: (req) => {
          const header = req.headers['x-request-id'];
          if (typeof header === 'string' && header.length > 0) return header;
          return randomUUID();
        },
        customProps: (req) => ({ request_id: req.id }),
        transport:
          process.env['NODE_ENV'] === 'production'
            ? undefined
            : { target: 'pino-pretty', options: { singleLine: true } },
      },
    }),
    ThrottlerModule.forRoot([
      { name: 'default', ttl: RATE_LIMIT_TTL_MS, limit: RATE_LIMIT_MAX },
    ]),
    PrismaModule,
    HealthModule,
    CategoriesModule,
    MembersModule,
    KudosModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
