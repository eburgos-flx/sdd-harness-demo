import type { ErrorCode, ErrorDetails, ErrorEnvelope } from '@shared-types';

export class KudosApiError extends Error {
  constructor(
    public readonly code: ErrorCode | string,
    message: string,
    public readonly status: number,
    public readonly details?: ErrorDetails,
  ) {
    super(message);
    this.name = 'KudosApiError';
  }
}

export function isErrorEnvelope(value: unknown): value is ErrorEnvelope {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof (value as { error: unknown }).error === 'object'
  );
}
