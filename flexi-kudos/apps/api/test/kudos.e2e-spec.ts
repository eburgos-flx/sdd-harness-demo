import 'reflect-metadata';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaPg } from '@prisma/adapter-pg';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { PrismaClient } from '../src/generated/prisma/client';

const SEED_MEMBERS = [
  { handle: 'e2e-alice', full_name: 'Alice E2E' },
  { handle: 'e2e-bob', full_name: 'Bob E2E' },
];

describe('kudos e2e', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let aliceId: string;
  let bobId: string;

  beforeAll(async () => {
    process.env['CURSOR_SECRET'] = 'e2e-secret';
    prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: process.env['DATABASE_URL'] }),
    });
    await prisma.kudo.deleteMany({});
    await prisma.member.deleteMany({ where: { handle: { in: SEED_MEMBERS.map((m) => m.handle) } } });
    for (const m of SEED_MEMBERS) {
      await prisma.member.create({ data: m });
    }
    const [alice, bob] = await Promise.all([
      prisma.member.findUnique({ where: { handle: 'e2e-alice' } }),
      prisma.member.findUnique({ where: { handle: 'e2e-bob' } }),
    ]);
    aliceId = alice!.id;
    bobId = bob!.id;

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        errorHttpStatusCode: 422,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  }, 30_000);

  afterAll(async () => {
    await app?.close();
    await prisma.kudo.deleteMany({});
    await prisma.member.deleteMany({ where: { handle: { in: SEED_MEMBERS.map((m) => m.handle) } } });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.kudo.deleteMany({});
  });

  it('GET /healthz returns 200 ok', async () => {
    const res = await request(app.getHttpServer()).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('GET /v1/categories returns 6 items with label', async () => {
    const res = await request(app.getHttpServer()).get('/v1/categories');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(6);
    expect(res.body[0]).toEqual({ key: 'teamwork', label: 'Trabajo en equipo' });
  });

  it('POST /v1/kudos happy path creates a kudo and returns expanded DTO', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/kudos')
      .send({
        giver_id: aliceId,
        receiver_id: bobId,
        category: 'teamwork',
        message: 'buen equipo',
      });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      giver: { id: aliceId, handle: 'e2e-alice' },
      receiver: { id: bobId, handle: 'e2e-bob' },
      category: { key: 'teamwork', label: 'Trabajo en equipo' },
      message: 'buen equipo',
    });
    expect(typeof res.body.created_at).toBe('string');
  });

  it('POST /v1/kudos rejects self-kudo with 422 SELF_KUDO_FORBIDDEN', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/kudos')
      .send({
        giver_id: aliceId,
        receiver_id: aliceId,
        category: 'teamwork',
        message: 'auto',
      });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('SELF_KUDO_FORBIDDEN');
  });

  it('POST /v1/kudos rejects unknown member with 422 MEMBER_NOT_FOUND', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/kudos')
      .send({
        giver_id: '00000000-0000-4000-8000-000000000000',
        receiver_id: bobId,
        category: 'teamwork',
        message: 'x',
      });
    expect(res.status).toBe(422);
    expect(res.body.error).toMatchObject({
      code: 'MEMBER_NOT_FOUND',
      details: { field: 'giver_id' },
    });
  });

  it('POST /v1/kudos rejects invalid category with 422 INVALID_CATEGORY', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/kudos')
      .send({
        giver_id: aliceId,
        receiver_id: bobId,
        category: 'sarcasmo',
        message: 'x',
      });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('INVALID_CATEGORY');
    expect(res.body.error.details.allowed).toContain('teamwork');
  });

  it('POST /v1/kudos rejects message > 280 code points with MESSAGE_TOO_LONG', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/kudos')
      .send({
        giver_id: aliceId,
        receiver_id: bobId,
        category: 'teamwork',
        message: 'a'.repeat(281),
      });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toMatch(/MESSAGE_TOO_LONG|VALIDATION_ERROR/);
  });

  it('GET /v1/kudos paginates by cursor without duplicates', async () => {
    for (let i = 0; i < 5; i++) {
      await prisma.kudo.create({
        data: {
          giver_id: aliceId,
          receiver_id: bobId,
          category: 'teamwork',
          message: `kudo #${i}`,
        },
      });
    }
    const first = await request(app.getHttpServer()).get('/v1/kudos?limit=2');
    expect(first.status).toBe(200);
    expect(first.body.items).toHaveLength(2);
    expect(first.body.next_cursor).toBeTruthy();

    const second = await request(app.getHttpServer()).get(
      `/v1/kudos?limit=2&cursor=${encodeURIComponent(first.body.next_cursor)}`,
    );
    expect(second.status).toBe(200);
    expect(second.body.items).toHaveLength(2);

    const firstIds = first.body.items.map((k: { id: string }) => k.id);
    const secondIds = second.body.items.map((k: { id: string }) => k.id);
    expect(firstIds.every((id: string) => !secondIds.includes(id))).toBe(true);
  });

  it('GET /v1/kudos rejects invalid cursor with 400 INVALID_CURSOR', async () => {
    const res = await request(app.getHttpServer()).get('/v1/kudos?cursor=totally-bogus');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_CURSOR');
  });

  it('GET /v1/kudos caps limit to 50 silently', async () => {
    const res = await request(app.getHttpServer()).get('/v1/kudos?limit=999');
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeLessThanOrEqual(50);
  });
});
