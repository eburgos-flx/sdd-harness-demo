import { HttpException, HttpStatus } from '@nestjs/common';
import type { ErrorCode, ErrorDetails } from '@shared-types';

export class DomainException extends HttpException {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    status: HttpStatus,
    public readonly details?: ErrorDetails,
  ) {
    super({ code, message, details }, status);
  }
}

export class SelfKudoForbiddenException extends DomainException {
  constructor() {
    super(
      'SELF_KUDO_FORBIDDEN',
      'no podés darte un kudo a vos mismo',
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

export class MemberNotFoundException extends DomainException {
  constructor(field: 'giver_id' | 'receiver_id') {
    super(
      'MEMBER_NOT_FOUND',
      `member referenced by ${field} does not exist or is not active`,
      HttpStatus.UNPROCESSABLE_ENTITY,
      { field },
    );
  }
}

export class InvalidCategoryException extends DomainException {
  constructor(allowed: readonly string[]) {
    super(
      'INVALID_CATEGORY',
      'category is not in the allowed set',
      HttpStatus.UNPROCESSABLE_ENTITY,
      { allowed },
    );
  }
}

export class MessageTooLongException extends DomainException {
  constructor() {
    super(
      'MESSAGE_TOO_LONG',
      'message must be at most 280 code points',
      HttpStatus.UNPROCESSABLE_ENTITY,
      { field: 'message' },
    );
  }
}

export class InvalidCursorException extends DomainException {
  constructor() {
    super(
      'INVALID_CURSOR',
      'cursor is malformed or does not match the current dataset',
      HttpStatus.BAD_REQUEST,
    );
  }
}
