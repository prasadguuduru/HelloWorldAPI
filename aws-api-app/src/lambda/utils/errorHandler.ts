// Error handling utilities with typed error classes

import { APIGatewayProxyResult } from 'aws-lambda';
import {
    ApiError,
    ValidationError,
    NotFoundError,
    InternalServerError,
    RateLimitError,
    UnauthorizedError,
    ForbiddenError,
    BadRequestError,
    ConflictError,
    isApiError,
    HttpStatusCode,
} from '../../types';
import { createErrorResponse } from './response';

// Re-export error classes for convenience
export {
    ApiError,
    ValidationError,
    NotFoundError,
    InternalServerError,
    RateLimitError,
    UnauthorizedError,
    ForbiddenError,
    BadRequestError,
    ConflictError,
    isApiError,
} from '../../types';

/**
 * Handle any error and convert it to an API Gateway response
 */
export function handleError(error: unknown): APIGatewayProxyResult {
    console.error('Error occurred:', error);

    // If it's already an ApiError, use its toResponse method
    if (isApiError(error)) {
        return error.toResponse();
    }

    // Handle standard JavaScript errors
    if (error instanceof Error) {
        // Check for specific error types by message or name
        if (error.message.includes('validation') || error.message.includes('invalid')) {
            return new ValidationError(error.message).toResponse();
        }

        if (error.message.includes('not found') || error.message.includes('does not exist')) {
            return new NotFoundError(error.message).toResponse();
        }

        if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
            return new UnauthorizedError(error.message).toResponse();
        }

        if (error.message.includes('forbidden') || error.message.includes('permission')) {
            return new ForbiddenError(error.message).toResponse();
        }

        if (error.message.includes('conflict') || error.message.includes('already exists')) {
            return new ConflictError(error.message).toResponse();
        }

        if (error.message.includes('rate limit') || error.message.includes('throttle')) {
            return new RateLimitError(error.message).toResponse();
        }

        // Generic error with the original message
        return new InternalServerError(`Internal server error: ${error.message}`).toResponse();
    }

    // Handle unknown error types
    return new InternalServerError('An unexpected error occurred').toResponse();
}

/**
 * Wrap a Lambda handler with error handling
 */
export function withErrorHandling<T extends any[], R>(
    handler: (...args: T) => Promise<R>
): (...args: T) => Promise<R | APIGatewayProxyResult> {
    return async (...args: T): Promise<R | APIGatewayProxyResult> => {
        try {
            return await handler(...args);
        } catch (error) {
            return handleError(error);
        }
    };
}

/**
 * Create a validation error from validation results
 */
export function createValidationError(errors: Array<{ field: string; message: string }>): ValidationError {
    const messages = errors.map(err => `${err.field}: ${err.message}`);
    return new ValidationError(`Validation failed: ${messages.join(', ')}`);
}

/**
 * Assert that a condition is true, throw error if false
 */
export function assert(condition: boolean, error: ApiError): void {
    if (!condition) {
        throw error;
    }
}

/**
 * Assert that a value is not null/undefined, throw NotFoundError if it is
 */
export function assertExists<T>(value: T | null | undefined, message?: string): asserts value is T {
    if (value === null || value === undefined) {
        throw new NotFoundError(message || 'Resource not found');
    }
}

/**
 * Assert that a value is valid, throw ValidationError if not
 */
export function assertValid(condition: boolean, message: string): void {
    if (!condition) {
        throw new ValidationError(message);
    }
}

/**
 * Try to execute a function and return a result or error
 */
export async function tryAsync<T>(
    fn: () => Promise<T>
): Promise<{ success: true; data: T } | { success: false; error: ApiError }> {
    try {
        const data = await fn();
        return { success: true, data };
    } catch (error) {
        if (isApiError(error)) {
            return { success: false, error };
        }
        return { success: false, error: new InternalServerError('An unexpected error occurred') };
    }
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Don't retry on client errors (4xx)
            if (isApiError(error) && error.statusCode >= 400 && error.statusCode < 500) {
                throw error;
            }

            // Don't retry on the last attempt
            if (attempt === maxRetries) {
                break;
            }

            // Wait with exponential backoff
            const delay = baseDelay * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}

/**
 * Log error with context information
 */
export function logError(error: unknown, context: Record<string, any> = {}): void {
    const errorInfo = {
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
        } : error,
        context,
    };

    console.error('Error logged:', JSON.stringify(errorInfo, null, 2));
}

/**
 * Create a timeout promise that rejects after specified milliseconds
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
            reject(new InternalServerError(`Operation timed out after ${timeoutMs}ms`));
        }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
}