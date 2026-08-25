import { Injectable } from '@nestjs/common';
import type {
  CategoryKey,
  CreateKudoRequest,
  KudoDto,
  KudoListResponse,
  MemberDto,
} from '@shared-types';
import {
  CATEGORIES,
  CATEGORY_KEYS,
  isValidCategoryKey,
} from '../categories/categories.constants';
import {
  InvalidCategoryException,
  MemberNotFoundException,
  SelfKudoForbiddenException,
} from '../common/exceptions/domain.exceptions';
import { PrismaService } from '../prisma/prisma.service';
import { decodeCursor, encodeCursor } from './cursor.util';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

interface KudoWithRelations {
  id: string;
  category: string;
  message: string;
  created_at: Date;
  giver: MemberDto;
  receiver: MemberDto;
}

@Injectable()
export class KudosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateKudoRequest): Promise<KudoDto> {
    if (input.giver_id === input.receiver_id) {
      throw new SelfKudoForbiddenException();
    }
    if (!isValidCategoryKey(input.category)) {
      throw new InvalidCategoryException(CATEGORY_KEYS);
    }

    const [giver, receiver] = await Promise.all([
      this.prisma.member.findFirst({
        where: { id: input.giver_id, is_active: true },
        select: { id: true, full_name: true, handle: true },
      }),
      this.prisma.member.findFirst({
        where: { id: input.receiver_id, is_active: true },
        select: { id: true, full_name: true, handle: true },
      }),
    ]);

    if (!giver) throw new MemberNotFoundException('giver_id');
    if (!receiver) throw new MemberNotFoundException('receiver_id');

    const trimmedMessage = input.message.trim();

    const created = await this.prisma.kudo.create({
      data: {
        giver_id: input.giver_id,
        receiver_id: input.receiver_id,
        category: input.category,
        message: trimmedMessage,
      },
      select: { id: true, category: true, message: true, created_at: true },
    });

    return this.toKudoDto({
      id: created.id,
      category: created.category,
      message: created.message,
      created_at: created.created_at,
      giver,
      receiver,
    });
  }

  async list(
    limit: number | undefined,
    cursor: string | undefined,
    secret: string,
  ): Promise<KudoListResponse> {
    const effectiveLimit = Math.min(
      Math.max(limit ?? DEFAULT_LIMIT, 1),
      MAX_LIMIT,
    );

    const where = cursor
      ? this.buildCursorWhere(cursor, secret)
      : undefined;

    const rows = await this.prisma.kudo.findMany({
      where,
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      take: effectiveLimit + 1,
      select: {
        id: true,
        category: true,
        message: true,
        created_at: true,
        giver: { select: { id: true, full_name: true, handle: true } },
        receiver: { select: { id: true, full_name: true, handle: true } },
      },
    });

    const hasMore = rows.length > effectiveLimit;
    const items = hasMore ? rows.slice(0, effectiveLimit) : rows;

    const next = hasMore ? items[items.length - 1] : null;
    const next_cursor = next
      ? encodeCursor(
          { t: next.created_at.toISOString(), i: next.id },
          secret,
        )
      : null;

    return {
      items: items.map((row) => this.toKudoDto(row)),
      next_cursor,
    };
  }

  private buildCursorWhere(cursor: string, secret: string) {
    const decoded = decodeCursor(cursor, secret);
    const cursorDate = new Date(decoded.t);
    return {
      OR: [
        { created_at: { lt: cursorDate } },
        { created_at: cursorDate, id: { lt: decoded.i } },
      ],
    };
  }

  private toKudoDto(row: KudoWithRelations): KudoDto {
    const category = CATEGORIES.find((c) => c.key === (row.category as CategoryKey));
    return {
      id: row.id,
      giver: row.giver,
      receiver: row.receiver,
      category: category ?? { key: row.category as CategoryKey, label: row.category },
      message: row.message,
      created_at: row.created_at.toISOString(),
    };
  }
}
