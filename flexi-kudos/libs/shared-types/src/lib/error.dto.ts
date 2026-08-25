export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'MEMBER_NOT_FOUND'
  | 'SELF_KUDO_FORBIDDEN'
  | 'INVALID_CATEGORY'
  | 'MESSAGE_TOO_LONG'
  | 'INVALID_CURSOR'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export interface ErrorDetails {
  field?: string;
  allowed?: readonly string[];
  [key: string]: unknown;
}

export interface ErrorEnvelope {
  error: {
    code: ErrorCode;
    message: string;
    details?: ErrorDetails;
  };
}
