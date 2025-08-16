// Unit tests for validation utilities

import {
  validateSchema,
  validateCreateItemRequest,
  validateUpdateItemRequest,
  validateItemId,
  validateListQueryParams,
  parseAndValidateJson,
} from '../../../src/lambda/utils/validation';
import { ValidationSchema } from '../../../src/types';

describe('Validation Utilities', () => {
  describe('validateSchema', () => {
    const testSchema: ValidationSchema = {
      rules: [
        {
          field: 'name',
          required: true,
          type: 'string',
          minLength: 1,
          maxLength: 100,
        },
        {
          field: 'age',
          required: false,
          type: 'number',
          min: 0,
          max: 150,
        },
      ],
      strict: true,
    };

    it('should validate valid data successfully', () => {
      const data = { name: 'John Doe', age: 30 };
      const result = validateSchema(data, testSchema);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const data = { age: 30 };
      const result = validateSchema(data, testSchema);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('name');
      expect(result.errors[0].message).toContain('required');
    });

    it('should validate field types', () => {
      const data = { name: 123, age: 30 };
      const result = validateSchema(data, testSchema);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('name');
      expect(result.errors[0].message).toContain('type string');
    });

    it('should validate string length constraints', () => {
      const data = { name: '', age: 30 };
      const result = validateSchema(data, testSchema);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('name');
      expect(result.errors[0].message).toContain('at least 1 characters');
    });

    it('should validate number range constraints', () => {
      const data = { name: 'John', age: 200 };
      const result = validateSchema(data, testSchema);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('age');
      expect(result.errors[0].message).toContain('no more than 150');
    });

    it('should detect unknown fields in strict mode', () => {
      const data = { name: 'John', age: 30, unknown: 'field' };
      const result = validateSchema(data, testSchema);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('unknown');
      expect(result.errors[0].message).toContain('Unknown field');
    });

    it('should allow unknown fields in non-strict mode', () => {
      const nonStrictSchema = { ...testSchema, strict: false };
      const data = { name: 'John', age: 30, unknown: 'field' };
      const result = validateSchema(data, nonStrictSchema);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle non-object data', () => {
      const result = validateSchema('not an object', testSchema);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('root');
      expect(result.errors[0].message).toBe('Data must be an object');
    });
  });

  describe('validateCreateItemRequest', () => {
    it('should validate valid create request', () => {
      const data = {
        name: 'Test Item',
        description: 'Test Description',
      };
      const result = validateCreateItemRequest(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require name field', () => {
      const data = {
        description: 'Test Description',
      };
      const result = validateCreateItemRequest(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'name')).toBe(true);
    });

    it('should require description field', () => {
      const data = {
        name: 'Test Item',
      };
      const result = validateCreateItemRequest(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'description')).toBe(true);
    });

    it('should reject empty name', () => {
      const data = {
        name: '',
        description: 'Test Description',
      };
      const result = validateCreateItemRequest(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'name' && e.message.includes('empty'))).toBe(true);
    });

    it('should reject empty description', () => {
      const data = {
        name: 'Test Item',
        description: '',
      };
      const result = validateCreateItemRequest(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'description' && e.message.includes('empty'))).toBe(true);
    });

    it('should reject unknown fields', () => {
      const data = {
        name: 'Test Item',
        description: 'Test Description',
        unknown: 'field',
      };
      const result = validateCreateItemRequest(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'unknown')).toBe(true);
    });
  });

  describe('validateUpdateItemRequest', () => {
    it('should validate valid update request', () => {
      const data = {
        name: 'Updated Item',
        description: 'Updated Description',
        status: 'inactive' as const,
      };
      const result = validateUpdateItemRequest(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should allow partial updates', () => {
      const data = {
        name: 'Updated Item',
      };
      const result = validateUpdateItemRequest(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate status enum', () => {
      const data = {
        status: 'invalid-status',
      };
      const result = validateUpdateItemRequest(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'status')).toBe(true);
    });

    it('should reject empty name when provided', () => {
      const data = {
        name: '',
      };
      const result = validateUpdateItemRequest(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'name' && e.message.includes('empty'))).toBe(true);
    });

    it('should allow empty request body', () => {
      const data = {};
      const result = validateUpdateItemRequest(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateItemId', () => {
    it('should validate valid item ID', () => {
      const result = validateItemId('123');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject null ID', () => {
      const result = validateItemId(null);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('id');
      expect(result.errors[0].message).toContain('required');
    });

    it('should reject undefined ID', () => {
      const result = validateItemId(undefined);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('id');
      expect(result.errors[0].message).toContain('required');
    });

    it('should reject non-string ID', () => {
      const result = validateItemId(123);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('id');
      expect(result.errors[0].message).toContain('string');
    });

    it('should reject empty string ID', () => {
      const result = validateItemId('');

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('id');
      expect(result.errors[0].message).toContain('empty');
    });
  });

  describe('validateListQueryParams', () => {
    it('should validate valid query params', () => {
      const params = {
        limit: '10',
        offset: '0',
        status: 'active',
      };
      const result = validateListQueryParams(params);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should allow empty params', () => {
      const result = validateListQueryParams({});

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should allow null params', () => {
      const result = validateListQueryParams(null);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate limit range', () => {
      const params = { limit: '200' };
      const result = validateListQueryParams(params);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'limit')).toBe(true);
    });

    it('should validate offset is non-negative', () => {
      const params = { offset: '-1' };
      const result = validateListQueryParams(params);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'offset')).toBe(true);
    });

    it('should validate status enum', () => {
      const params = { status: 'invalid' };
      const result = validateListQueryParams(params);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'status')).toBe(true);
    });
  });

  describe('parseAndValidateJson', () => {
    it('should parse valid JSON', () => {
      const json = '{"name": "test", "value": 123}';
      const result = parseAndValidateJson(json);

      expect(result.data).toEqual({ name: 'test', value: 123 });
      expect(result.error).toBeUndefined();
    });

    it('should handle null body', () => {
      const result = parseAndValidateJson(null);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Request body is required');
    });

    it('should handle invalid JSON', () => {
      const result = parseAndValidateJson('invalid json');

      expect(result.data).toBeNull();
      expect(result.error).toBe('Invalid JSON format');
    });

    it('should handle empty string', () => {
      const result = parseAndValidateJson('');

      expect(result.data).toBeNull();
      expect(result.error).toBe('Request body is required');
    });
  });
});