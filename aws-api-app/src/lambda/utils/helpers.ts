// Common helper functions for Lambda operations

import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { createLogger, createLambdaLogger } from './logger';
import { parseAndValidateJson } from './validation';
import { createOptionsResponse } from './response';

/**
 * Extract path parameters from API Gateway event with type safety
 */
export function getPathParameters<T = Record<string, string>>(
  event: APIGatewayProxyEvent
): T | null {
  return (event.pathParameters as T) || null;
}

/**
 * Extract query string parameters from API Gateway event with type safety
 */
export function getQueryParameters<T = Record<string, string>>(
  event: APIGatewayProxyEvent
): T | null {
  return (event.queryStringParameters as T) || null;
}

/**
 * Extract and parse JSON body from API Gateway event
 */
export function getJsonBody<T = any>(event: APIGatewayProxyEvent): T | null {
  if (!event.body) {
    return null;
  }

  const { data, error } = parseAndValidateJson(event.body);
  if (error) {
    throw new Error(error);
  }

  return data as T;
}

/**
 * Extract headers from API Gateway event
 */
export function getHeaders(event: APIGatewayProxyEvent): Record<string, string> {
  const headers: Record<string, string> = {};
  if (event.headers) {
    for (const [key, value] of Object.entries(event.headers)) {
      if (value !== undefined) {
        headers[key] = value;
      }
    }
  }
  return headers;
}

/**
 * Get the HTTP method from the event
 */
export function getHttpMethod(event: APIGatewayProxyEvent): string {
  return event.httpMethod;
}

/**
 * Get the resource path from the event
 */
export function getResourcePath(event: APIGatewayProxyEvent): string {
  return event.resource || event.path || '';
}

/**
 * Check if the request is a CORS preflight request
 */
export function isCorsPreflightRequest(event: APIGatewayProxyEvent): boolean {
  return event.httpMethod === 'OPTIONS';
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreflightRequest() {
  return createOptionsResponse();
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get request ID from Lambda context or generate one
 */
export function getRequestId(context: Context): string {
  return context.awsRequestId || generateRequestId();
}

/**
 * Create a logger for the current Lambda execution
 */
export function createRequestLogger(event: APIGatewayProxyEvent, context: Context) {
  const requestId = getRequestId(context);
  const functionName = context.functionName;
  
  const logger = createLambdaLogger(functionName, requestId);
  
  // Log request start
  logger.logLambdaStart(functionName, event);
  
  return logger;
}

/**
 * Get the source IP address from the request
 */
export function getSourceIp(event: APIGatewayProxyEvent): string {
  return event.requestContext?.identity?.sourceIp || 'unknown';
}

/**
 * Get the user agent from the request
 */
export function getUserAgent(event: APIGatewayProxyEvent): string {
  return event.headers?.['User-Agent'] || event.headers?.['user-agent'] || 'unknown';
}

/**
 * Check if the request is from a mobile device
 */
export function isMobileRequest(event: APIGatewayProxyEvent): boolean {
  const userAgent = getUserAgent(event).toLowerCase();
  return /mobile|android|iphone|ipad|phone/i.test(userAgent);
}

/**
 * Extract authorization token from headers
 */
export function getAuthToken(event: APIGatewayProxyEvent): string | null {
  const authHeader = event.headers?.['Authorization'] || event.headers?.['authorization'];
  
  if (!authHeader) {
    return null;
  }

  // Extract Bearer token
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

/**
 * Get the stage from the request context
 */
export function getStage(event: APIGatewayProxyEvent): string {
  return event.requestContext?.stage || 'unknown';
}

/**
 * Get the API Gateway request ID
 */
export function getApiGatewayRequestId(event: APIGatewayProxyEvent): string {
  return event.requestContext?.requestId || 'unknown';
}

/**
 * Create a correlation ID for tracing requests
 */
export function createCorrelationId(event: APIGatewayProxyEvent, context: Context): string {
  const apiGatewayRequestId = getApiGatewayRequestId(event);
  const lambdaRequestId = getRequestId(context);
  return `${apiGatewayRequestId}-${lambdaRequestId}`;
}

/**
 * Measure Lambda cold start
 */
let isWarmStart = false;
export function isColdStart(): boolean {
  if (isWarmStart) {
    return false;
  }
  isWarmStart = true;
  return true;
}

/**
 * Get remaining time in Lambda execution
 */
export function getRemainingTime(context: Context): number {
  return context.getRemainingTimeInMillis();
}

/**
 * Check if Lambda is running out of time
 */
export function isRunningOutOfTime(context: Context, bufferMs: number = 1000): boolean {
  return getRemainingTime(context) < bufferMs;
}

/**
 * Parse comma-separated values from query parameter
 */
export function parseCommaSeparatedValues(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }
  return value.split(',').map(v => v.trim()).filter(v => v.length > 0);
}

/**
 * Convert string to boolean with default value
 */
export function parseBoolean(value: string | null | undefined, defaultValue: boolean = false): boolean {
  if (!value) {
    return defaultValue;
  }
  return value.toLowerCase() === 'true';
}

/**
 * Parse integer with default value and bounds checking
 */
export function parseInteger(
  value: string | null | undefined,
  defaultValue: number = 0,
  min?: number,
  max?: number
): number {
  if (!value) {
    return defaultValue;
  }

  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    return defaultValue;
  }

  if (min !== undefined && parsed < min) {
    return min;
  }

  if (max !== undefined && parsed > max) {
    return max;
  }

  return parsed;
}