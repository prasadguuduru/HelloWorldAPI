// Response helper functions for consistent API responses

import { APIGatewayProxyResult } from 'aws-lambda';
import { ApiResponse, HttpStatusCode, CorsHeaders } from '../../types';

/**
 * Default CORS headers
 */
const DEFAULT_CORS_HEADERS: CorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

/**
 * Default response headers
 */
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  ...DEFAULT_CORS_HEADERS,
};

/**
 * Create a standardized API Gateway response
 */
export function createResponse(
  statusCode: HttpStatusCode,
  body: any,
  headers: Record<string, string> = {}
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      ...DEFAULT_HEADERS,
      ...headers,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  };
}

/**
 * Create a success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  statusCode: HttpStatusCode = HttpStatusCode.OK
): APIGatewayProxyResult {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  };

  return createResponse(statusCode, response);
}

/**
 * Create an error response
 */
export function createErrorResponse(
  error: string,
  message: string,
  statusCode: HttpStatusCode = HttpStatusCode.INTERNAL_SERVER_ERROR
): APIGatewayProxyResult {
  const response: ApiResponse = {
    success: false,
    error,
    message,
  };

  return createResponse(statusCode, response);
}

/**
 * Create a validation error response
 */
export function createValidationErrorResponse(
  message: string,
  errors?: any[]
): APIGatewayProxyResult {
  const response: ApiResponse = {
    success: false,
    error: 'VALIDATION_ERROR',
    message,
    ...(errors && { data: { errors } }),
  };

  return createResponse(HttpStatusCode.BAD_REQUEST, response);
}

/**
 * Create a not found response
 */
export function createNotFoundResponse(
  message: string = 'Resource not found'
): APIGatewayProxyResult {
  const response: ApiResponse = {
    success: false,
    error: 'NOT_FOUND',
    message,
  };

  return createResponse(HttpStatusCode.NOT_FOUND, response);
}

/**
 * Create a created response (201)
 */
export function createCreatedResponse<T>(
  data: T,
  message?: string
): APIGatewayProxyResult {
  return createSuccessResponse(data, message, HttpStatusCode.CREATED);
}

/**
 * Create a no content response (204)
 */
export function createNoContentResponse(): APIGatewayProxyResult {
  return {
    statusCode: HttpStatusCode.NO_CONTENT,
    headers: DEFAULT_CORS_HEADERS,
    body: '',
  };
}

/**
 * Create an OPTIONS response for CORS preflight
 */
export function createOptionsResponse(): APIGatewayProxyResult {
  return {
    statusCode: HttpStatusCode.OK,
    headers: DEFAULT_CORS_HEADERS,
    body: '',
  };
}

/**
 * Create a rate limit error response
 */
export function createRateLimitResponse(
  message: string = 'Rate limit exceeded'
): APIGatewayProxyResult {
  const response: ApiResponse = {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message,
  };

  return createResponse(HttpStatusCode.RATE_LIMITED, response);
}

/**
 * Create an unauthorized response
 */
export function createUnauthorizedResponse(
  message: string = 'Unauthorized access'
): APIGatewayProxyResult {
  const response: ApiResponse = {
    success: false,
    error: 'UNAUTHORIZED',
    message,
  };

  return createResponse(HttpStatusCode.UNAUTHORIZED, response);
}