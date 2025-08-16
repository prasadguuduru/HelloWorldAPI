// Error handling type definitions

/**
 * Base error class for API errors
 */
export abstract class ApiError extends Error {
  abstract statusCode: number;
  abstract errorCode: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to API response format
   */
  toResponse(): {
    statusCode: number;
    body: string;
    headers: Record<string, string>;
  } {
    return {
      statusCode: this.statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: this.errorCode,
        message: this.message,
        statusCode: this.statusCode,
        timestamp: new Date().toISOString(),
      }),
    };
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends ApiError {
  statusCode = 400;
  errorCode = 'VALIDATION_ERROR';

  constructor(message: string = 'Invalid input data') {
    super(message);
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends ApiError {
  statusCode = 404;
  errorCode = 'NOT_FOUND';

  constructor(message: string = 'Resource not found') {
    super(message);
  }
}

/**
 * Internal server error (500)
 */
export class InternalServerError extends ApiError {
  statusCode = 500;
  errorCode = 'INTERNAL_SERVER_ERROR';

  constructor(message: string = 'Internal server error') {
    super(message);
  }
}

/**
 * Rate limit error (429)
 */
export class RateLimitError extends ApiError {
  statusCode = 429;
  errorCode = 'RATE_LIMIT_EXCEEDED';

  constructor(message: string = 'Rate limit exceeded') {
    super(message);
  }
}

/**
 * Unauthorized error (401)
 */
export class UnauthorizedError extends ApiError {
  statusCode = 401;
  errorCode = 'UNAUTHORIZED';

  constructor(message: string = 'Unauthorized access') {
    super(message);
  }
}

/**
 * Forbidden error (403)
 */
export class ForbiddenError extends ApiError {
  statusCode = 403;
  errorCode = 'FORBIDDEN';

  constructor(message: string = 'Access forbidden') {
    super(message);
  }
}

/**
 * Bad request error (400)
 */
export class BadRequestError extends ApiError {
  statusCode = 400;
  errorCode = 'BAD_REQUEST';

  constructor(message: string = 'Bad request') {
    super(message);
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends ApiError {
  statusCode = 409;
  errorCode = 'CONFLICT';

  constructor(message: string = 'Resource conflict') {
    super(message);
  }
}

/**
 * Type guard to check if error is an ApiError
 */
export function isApiError(error: any): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Error response type
 */
export interface ErrorResponseBody {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}