import type { ErrorCode, ErrorEnvelope } from './error.dto';

describe('ErrorCode contract', () => {
  it('covers the seven business codes plus INTERNAL_ERROR fallback', () => {
    const codes: ErrorCode[] = [
      'VALIDATION_ERROR',
      'MEMBER_NOT_FOUND',
      'SELF_KUDO_FORBIDDEN',
      'INVALID_CATEGORY',
      'MESSAGE_TOO_LONG',
      'INVALID_CURSOR',
      'RATE_LIMITED',
      'INTERNAL_ERROR',
    ];
    expect(codes).toHaveLength(8);
  });

  it('ErrorEnvelope shape carries code, message and optional details', () => {
    const sample: ErrorEnvelope = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'message must not be empty',
        details: { field: 'message' },
      },
    };
    expect(sample.error.code).toBe('VALIDATION_ERROR');
    expect(sample.error.details?.field).toBe('message');
  });
});
