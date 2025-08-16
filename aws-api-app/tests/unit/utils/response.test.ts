// Unit tests for response utilities

import {
  createResponse,
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  createNotFoundResponse,
  createCreatedResponse,
  createNoContentResponse,
  createOptionsResponse,
  createRateLimitResponse,
  createUnauthorizedResponse,
} from '../../../src/lambda/utils/response';
import { HttpStatusCode } from '../../../src/types';

describe('Response Utilities', () => {
  describe('createResponse', () => {
    it('should create a basic response with status code and body', () => {
      const response = createResponse(HttpStatusCode.OK, { message: 'test' });

      expect(response.statusCode).toBe(200);
      expect(response.headers).toHaveProperty('Content-Type', 'application/json');
      expect(response.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
      expect(JSON.parse(response.body)).toEqual({ message: 'test' });
    });

    it('should handle string body', () => {
      const response = createResponse(HttpStatusCode.OK, 'test string');

      expect(response.body).toBe('test string');
    });

    it('should merge custom headers', () => {
      const customHeaders = { 'X-Custom-Header': 'custom-value' };
      const response = createResponse(HttpStatusCode.OK, { message: 'test' }, customHeaders);

      expect(response.headers).toHaveProperty('X-Custom-Header', 'custom-value');
      expect(response.headers).toHaveProperty('Content-Type', 'application/json');
    });
  });

  describe('createSuccessResponse', () => {
    it('should create a success response with data', () => {
      const data = { id: '1', name: 'Test Item' };
      const response = createSuccessResponse(data, 'Success message');

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(data);
      expect(body.message).toBe('Success message');
    });

    it('should use custom status code', () => {
      const response = createSuccessResponse({ id: '1' }, 'Created', HttpStatusCode.CREATED);

      expect(response.statusCode).toBe(201);
    });

    it('should work without message', () => {
      const response = createSuccessResponse({ id: '1' });

      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body).not.toHaveProperty('message');
    });
  });

  describe('createErrorResponse', () => {
    it('should create an error response', () => {
      const response = createErrorResponse('VALIDATION_ERROR', 'Invalid input', HttpStatusCode.BAD_REQUEST);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('VALIDATION_ERROR');
      expect(body.message).toBe('Invalid input');
    });

    it('should use default status code', () => {
      const response = createErrorResponse('ERROR', 'Something went wrong');

      expect(response.statusCode).toBe(500);
    });
  });

  describe('createValidationErrorResponse', () => {
    it('should create a validation error response', () => {
      const errors = [{ field: 'name', message: 'Name is required' }];
      const response = createValidationErrorResponse('Validation failed', errors);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('VALIDATION_ERROR');
      expect(body.message).toBe('Validation failed');
      expect(body.data.errors).toEqual(errors);
    });

    it('should work without errors array', () => {
      const response = createValidationErrorResponse('Validation failed');

      const body = JSON.parse(response.body);
      expect(body).not.toHaveProperty('data');
    });
  });

  describe('createNotFoundResponse', () => {
    it('should create a not found response', () => {
      const response = createNotFoundResponse('Item not found');

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('NOT_FOUND');
      expect(body.message).toBe('Item not found');
    });

    it('should use default message', () => {
      const response = createNotFoundResponse();

      const body = JSON.parse(response.body);
      expect(body.message).toBe('Resource not found');
    });
  });

  describe('createCreatedResponse', () => {
    it('should create a created response', () => {
      const data = { id: '1', name: 'New Item' };
      const response = createCreatedResponse(data, 'Item created');

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(data);
      expect(body.message).toBe('Item created');
    });
  });

  describe('createNoContentResponse', () => {
    it('should create a no content response', () => {
      const response = createNoContentResponse();

      expect(response.statusCode).toBe(204);
      expect(response.body).toBe('');
      expect(response.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    });
  });

  describe('createOptionsResponse', () => {
    it('should create an OPTIONS response for CORS', () => {
      const response = createOptionsResponse();

      expect(response.statusCode).toBe(200);
      expect(response.body).toBe('');
      expect(response.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
      expect(response.headers).toHaveProperty('Access-Control-Allow-Methods');
      expect(response.headers).toHaveProperty('Access-Control-Allow-Headers');
    });
  });

  describe('createRateLimitResponse', () => {
    it('should create a rate limit response', () => {
      const response = createRateLimitResponse('Too many requests');

      expect(response.statusCode).toBe(429);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('RATE_LIMIT_EXCEEDED');
      expect(body.message).toBe('Too many requests');
    });

    it('should use default message', () => {
      const response = createRateLimitResponse();

      const body = JSON.parse(response.body);
      expect(body.message).toBe('Rate limit exceeded');
    });
  });

  describe('createUnauthorizedResponse', () => {
    it('should create an unauthorized response', () => {
      const response = createUnauthorizedResponse('Invalid token');

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('UNAUTHORIZED');
      expect(body.message).toBe('Invalid token');
    });

    it('should use default message', () => {
      const response = createUnauthorizedResponse();

      const body = JSON.parse(response.body);
      expect(body.message).toBe('Unauthorized access');
    });
  });
});