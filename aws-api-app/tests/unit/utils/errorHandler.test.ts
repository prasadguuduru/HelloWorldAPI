// Unit tests for error handler utilities

import {
  handleError,
  withErrorHandling,
  createValidationError,
  assert,
  assertExists,
  assertValid,
  tryAsync,
  retryWithBackoff,
  withTimeout,
} from '../../../src/lambda/utils/errorHandler';
import {
  ValidationError,
  NotFoundError,
  InternalServerError,
  UnauthorizedError,
  ApiError,
} from '../../../src/types';

describe('Error Handler Utilities', () => {
  describe('handleError', () => {
    it('should handle ApiError instances', () => {
      const error = new ValidationError('Test validation error');
      const response = handleError(error);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('VALIDATION_ERROR');
      expect(body.message).toBe('Test validation error');
    });

    it('should handle standard Error instances', () => {
      const error = new Error('Standard error');
      const response = handleError(error);

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.message).toContain('Internal server error');
    });

    it('should detect validation errors by message', () => {
      const error = new Error('validation failed');
      const response = handleError(error);

      expect(response.statusCode).toBe(400);
    });

    it('should detect not found errors by message', () => {
      const error = new Error('item not found');
      const response = handleError(error);

      expect(response.statusCode).toBe(404);
    });

    it('should detect unauthorized errors by message', () => {
      const error = new Error('unauthorized access');
      const response = handleError(error);

      expect(response.statusCode).toBe(401);
    });

    it('should handle unknown error types', () => {
      const response = handleError('string error');

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('An unexpected error occurred');
    });
  });

  describe('withErrorHandling', () => {
    it('should return result when no error occurs', async () => {
      const handler = jest.fn().mockResolvedValue('success');
      const wrappedHandler = withErrorHandling(handler);

      const result = await wrappedHandler('arg1', 'arg2');

      expect(result).toBe('success');
      expect(handler).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should handle errors and return error response', async () => {
      const error = new ValidationError('Test error');
      const handler = jest.fn().mockRejectedValue(error);
      const wrappedHandler = withErrorHandling(handler);

      const result = await wrappedHandler('arg1');

      expect(result).toHaveProperty('statusCode', 400);
      expect(handler).toHaveBeenCalledWith('arg1');
    });
  });

  describe('createValidationError', () => {
    it('should create validation error from error array', () => {
      const errors = [
        { field: 'name', message: 'Name is required' },
        { field: 'email', message: 'Invalid email format' },
      ];
      const error = createValidationError(errors);

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('name: Name is required');
      expect(error.message).toContain('email: Invalid email format');
    });
  });

  describe('assert', () => {
    it('should not throw when condition is true', () => {
      expect(() => {
        assert(true, new ValidationError('Should not throw'));
      }).not.toThrow();
    });

    it('should throw provided error when condition is false', () => {
      const error = new ValidationError('Test error');
      expect(() => {
        assert(false, error);
      }).toThrow(error);
    });
  });

  describe('assertExists', () => {
    it('should not throw when value exists', () => {
      expect(() => {
        assertExists('value');
      }).not.toThrow();

      expect(() => {
        assertExists(0);
      }).not.toThrow();

      expect(() => {
        assertExists(false);
      }).not.toThrow();
    });

    it('should throw NotFoundError when value is null', () => {
      expect(() => {
        assertExists(null);
      }).toThrow(NotFoundError);
    });

    it('should throw NotFoundError when value is undefined', () => {
      expect(() => {
        assertExists(undefined);
      }).toThrow(NotFoundError);
    });

    it('should use custom message', () => {
      expect(() => {
        assertExists(null, 'Custom not found message');
      }).toThrow('Custom not found message');
    });
  });

  describe('assertValid', () => {
    it('should not throw when condition is true', () => {
      expect(() => {
        assertValid(true, 'Should not throw');
      }).not.toThrow();
    });

    it('should throw ValidationError when condition is false', () => {
      expect(() => {
        assertValid(false, 'Validation failed');
      }).toThrow(ValidationError);
      
      expect(() => {
        assertValid(false, 'Validation failed');
      }).toThrow('Validation failed');
    });
  });

  describe('tryAsync', () => {
    it('should return success result when function succeeds', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await tryAsync(fn);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('success');
      }
    });

    it('should return error result when function throws ApiError', async () => {
      const error = new ValidationError('Test error');
      const fn = jest.fn().mockRejectedValue(error);
      const result = await tryAsync(fn);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(error);
      }
    });

    it('should return InternalServerError when function throws unknown error', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Unknown error'));
      const result = await tryAsync(fn);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(InternalServerError);
      }
    });
  });

  describe('retryWithBackoff', () => {
    it('should return result on first success', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await retryWithBackoff(fn, 3, 100);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on server errors', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new InternalServerError('Server error'))
        .mockResolvedValue('success');

      const result = await retryWithBackoff(fn, 3, 10);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should not retry on client errors', async () => {
      const error = new ValidationError('Client error');
      const fn = jest.fn().mockRejectedValue(error);

      await expect(retryWithBackoff(fn, 3, 10)).rejects.toThrow(error);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should throw last error after max retries', async () => {
      const error = new InternalServerError('Server error');
      const fn = jest.fn().mockRejectedValue(error);

      await expect(retryWithBackoff(fn, 2, 10)).rejects.toThrow(error);
      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('withTimeout', () => {
    it('should return result when promise resolves within timeout', async () => {
      const promise = Promise.resolve('success');
      const result = await withTimeout(promise, 1000);

      expect(result).toBe('success');
    });

    it('should throw timeout error when promise takes too long', async () => {
      const promise = new Promise(resolve => setTimeout(() => resolve('late'), 200));
      
      await expect(withTimeout(promise, 100)).rejects.toThrow(InternalServerError);
      await expect(withTimeout(promise, 100)).rejects.toThrow('timed out');
    });

    it('should throw original error when promise rejects quickly', async () => {
      const error = new ValidationError('Quick error');
      const promise = Promise.reject(error);

      await expect(withTimeout(promise, 1000)).rejects.toThrow(error);
    });
  });
});