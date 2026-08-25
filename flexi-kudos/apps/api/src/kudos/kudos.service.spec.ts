import { PrismaService } from '../prisma/prisma.service';
import { KudosService } from './kudos.service';
import {
  InvalidCategoryException,
  MemberNotFoundException,
  SelfKudoForbiddenException,
} from '../common/exceptions/domain.exceptions';

const MEMBER_A = {
  id: '11111111-1111-1111-1111-111111111111',
  full_name: 'Ana',
  handle: 'ana',
};
const MEMBER_B = {
  id: '22222222-2222-2222-2222-222222222222',
  full_name: 'Bruno',
  handle: 'bruno',
};

function buildService(memberFindFirst: jest.Mock, kudoCreate?: jest.Mock) {
  const prisma = {
    member: { findFirst: memberFindFirst },
    kudo: { create: kudoCreate ?? jest.fn(), findMany: jest.fn() },
  } as unknown as PrismaService;
  return new KudosService(prisma);
}

describe('KudosService.create', () => {
  it('rejects self-kudo with SelfKudoForbiddenException', async () => {
    const service = buildService(jest.fn());
    await expect(
      service.create({
        giver_id: MEMBER_A.id,
        receiver_id: MEMBER_A.id,
        category: 'teamwork',
        message: 'hi',
      }),
    ).rejects.toBeInstanceOf(SelfKudoForbiddenException);
  });

  it('rejects invalid category before touching db', async () => {
    const findFirst = jest.fn();
    const service = buildService(findFirst);
    await expect(
      service.create({
        giver_id: MEMBER_A.id,
        receiver_id: MEMBER_B.id,
        category: 'sarcasmo' as never,
        message: 'hi',
      }),
    ).rejects.toBeInstanceOf(InvalidCategoryException);
    expect(findFirst).not.toHaveBeenCalled();
  });

  it('rejects missing giver with MemberNotFoundException(giver_id)', async () => {
    const findFirst = jest
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(MEMBER_B);
    const service = buildService(findFirst);
    await expect(
      service.create({
        giver_id: MEMBER_A.id,
        receiver_id: MEMBER_B.id,
        category: 'teamwork',
        message: 'hi',
      }),
    ).rejects.toMatchObject({ code: 'MEMBER_NOT_FOUND', details: { field: 'giver_id' } });
  });

  it('rejects missing receiver with MemberNotFoundException(receiver_id)', async () => {
    const findFirst = jest
      .fn()
      .mockResolvedValueOnce(MEMBER_A)
      .mockResolvedValueOnce(null);
    const service = buildService(findFirst);
    await expect(
      service.create({
        giver_id: MEMBER_A.id,
        receiver_id: MEMBER_B.id,
        category: 'teamwork',
        message: 'hi',
      }),
    ).rejects.toMatchObject({ code: 'MEMBER_NOT_FOUND', details: { field: 'receiver_id' } });
  });

  it('creates kudo and returns expanded DTO with category label', async () => {
    const findFirst = jest
      .fn()
      .mockResolvedValueOnce(MEMBER_A)
      .mockResolvedValueOnce(MEMBER_B);
    const now = new Date('2026-08-24T10:00:00Z');
    const kudoCreate = jest.fn().mockResolvedValue({
      id: 'k-1',
      category: 'teamwork',
      message: 'buen laburo',
      created_at: now,
    });
    const service = buildService(findFirst, kudoCreate);

    const result = await service.create({
      giver_id: MEMBER_A.id,
      receiver_id: MEMBER_B.id,
      category: 'teamwork',
      message: '  buen laburo  ',
    });

    expect(kudoCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ message: 'buen laburo' }),
      }),
    );
    expect(result).toEqual({
      id: 'k-1',
      giver: MEMBER_A,
      receiver: MEMBER_B,
      category: { key: 'teamwork', label: 'Trabajo en equipo' },
      message: 'buen laburo',
      created_at: '2026-08-24T10:00:00.000Z',
    });
  });
});
