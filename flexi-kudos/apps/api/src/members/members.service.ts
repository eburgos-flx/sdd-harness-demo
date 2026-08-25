import { Injectable } from '@nestjs/common';
import type { MemberDto } from '@shared-types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async listActive(): Promise<MemberDto[]> {
    const members = await this.prisma.member.findMany({
      where: { is_active: true },
      orderBy: { full_name: 'asc' },
      select: { id: true, full_name: true, handle: true },
    });
    return members.sort((a, b) =>
      a.full_name.toLocaleLowerCase().localeCompare(b.full_name.toLocaleLowerCase(), 'es'),
    );
  }

  async findActiveById(id: string) {
    return this.prisma.member.findFirst({
      where: { id, is_active: true },
      select: { id: true, full_name: true, handle: true },
    });
  }
}
