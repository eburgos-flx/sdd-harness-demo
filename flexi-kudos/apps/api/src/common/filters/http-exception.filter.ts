import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import type { Response } from 'express';
import type { ErrorCode, ErrorEnvelope, ErrorDetails } from '@shared-types';
import { DomainException } from '../exceptions/domain.exceptions';

interface ValidationBody {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const { status, envelope } = this.toEnvelope(exception);

    if (status >= 500) {
      this.logger.error(
        `unhandled exception (${envelope.error.code}): ${envelope.error.message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json(envelope);
  }

  private toEnvelope(exception: unknown): {
    status: number;
    envelope: ErrorEnvelope;
  } {
    if (exception instanceof DomainException) {
      return {
        status: exception.getStatus(),
        envelope: {
          error: {
            code: exception.code,
            message: exception.message,
            details: exception.details,
          },
        },
      };
    }

    if (exception instanceof ThrottlerException) {
      return {
        status: HttpStatus.TOO_MANY_REQUESTS,
        envelope: {
          error: {
            code: 'RATE_LIMITED',
            message: 'too many requests, retry later',
          },
        },
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const { code, message, details } = this.mapHttpException(status, body);
      return {
        status,
        envelope: { error: { code, message, details } },
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      envelope: {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'internal server error',
        },
      },
    };
  }

  private mapHttpException(
    status: number,
    body: string | object,
  ): { code: ErrorCode; message: string; details?: ErrorDetails } {
    const parsed = typeof body === 'object' ? (body as ValidationBody) : {};
    const rawMessage = Array.isArray(parsed.message)
      ? parsed.message.join(', ')
      : (parsed.message ?? (typeof body === 'string' ? body : ''));

    if (status === HttpStatus.BAD_REQUEST) {
      return {
        code: 'VALIDATION_ERROR',
        message: rawMessage || 'validation failed',
      };
    }

    if (status === HttpStatus.UNPROCESSABLE_ENTITY) {
      return {
        code: 'VALIDATION_ERROR',
        message: rawMessage || 'unprocessable entity',
      };
    }

    if (status === HttpStatus.TOO_MANY_REQUESTS) {
      return {
        code: 'RATE_LIMITED',
        message: rawMessage || 'too many requests, retry later',
      };
    }

    return {
      code: 'INTERNAL_ERROR',
      message: rawMessage || 'internal server error',
    };
  }
}
