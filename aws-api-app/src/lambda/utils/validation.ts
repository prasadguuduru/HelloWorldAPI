// Validation utility functions with proper type guards

import {
  ValidationResult,
  ValidationErrorDetail,
  ValidationRule,
  ValidationSchema,
  isString,
  isNumber,
  isBoolean,
  isArray,
  isObject,
  isDefined,
  isNonEmptyString,
  isUUID,
  CreateItemRequest,
  UpdateItemRequest,
} from '../../types';

/**
 * Validate a single field against a rule
 */
function validateField(value: any, rule: ValidationRule): ValidationErrorDetail[] {
  const errors: ValidationErrorDetail[] = [];

  // Check if required field is missing
  if (rule.required && !isDefined(value)) {
    errors.push({
      field: rule.field,
      message: `${rule.field} is required`,
      value,
    });
    return errors;
  }

  // Skip validation if field is not required and not provided
  if (!rule.required && !isDefined(value)) {
    return errors;
  }

  // Type validation
  if (rule.type) {
    let isValidType = false;
    switch (rule.type) {
      case 'string':
        isValidType = isString(value);
        break;
      case 'number':
        isValidType = isNumber(value);
        break;
      case 'boolean':
        isValidType = isBoolean(value);
        break;
      case 'array':
        isValidType = isArray(value);
        break;
      case 'object':
        isValidType = isObject(value);
        break;
    }

    if (!isValidType) {
      errors.push({
        field: rule.field,
        message: `${rule.field} must be of type ${rule.type}`,
        value,
      });
      return errors; // Don't continue validation if type is wrong
    }
  }

  // String-specific validations
  if (isString(value)) {
    if (rule.minLength && value.length < rule.minLength) {
      errors.push({
        field: rule.field,
        message: `${rule.field} must be at least ${rule.minLength} characters long`,
        value,
      });
    }

    if (rule.maxLength && value.length > rule.maxLength) {
      errors.push({
        field: rule.field,
        message: `${rule.field} must be no more than ${rule.maxLength} characters long`,
        value,
      });
    }

    if (rule.pattern && !rule.pattern.test(value)) {
      errors.push({
        field: rule.field,
        message: `${rule.field} format is invalid`,
        value,
      });
    }
  }

  // Number-specific validations
  if (isNumber(value)) {
    if (rule.min !== undefined && value < rule.min) {
      errors.push({
        field: rule.field,
        message: `${rule.field} must be at least ${rule.min}`,
        value,
      });
    }

    if (rule.max !== undefined && value > rule.max) {
      errors.push({
        field: rule.field,
        message: `${rule.field} must be no more than ${rule.max}`,
        value,
      });
    }
  }

  // Enum validation
  if (rule.enum && !rule.enum.includes(value)) {
    errors.push({
      field: rule.field,
      message: `${rule.field} must be one of: ${rule.enum.join(', ')}`,
      value,
    });
  }

  // Custom validation
  if (rule.custom) {
    const customResult = rule.custom(value);
    if (customResult !== true) {
      errors.push({
        field: rule.field,
        message: typeof customResult === 'string' ? customResult : `${rule.field} is invalid`,
        value,
      });
    }
  }

  return errors;
}

/**
 * Validate an object against a schema
 */
export function validateSchema(data: any, schema: ValidationSchema): ValidationResult {
  const errors: ValidationErrorDetail[] = [];

  if (!isObject(data)) {
    errors.push({
      field: 'root',
      message: 'Data must be an object',
      value: data,
    });
    return { isValid: false, errors };
  }

  const dataObj = data as Record<string, any>;

  // Validate each rule
  for (const rule of schema.rules) {
    const fieldErrors = validateField(dataObj[rule.field], rule);
    errors.push(...fieldErrors);
  }

  // Check for unknown fields if strict mode is enabled
  if (schema.strict) {
    const allowedFields = schema.rules.map(rule => rule.field);
    const providedFields = Object.keys(dataObj);
    const unknownFields = providedFields.filter(field => !allowedFields.includes(field));

    for (const field of unknownFields) {
      errors.push({
        field,
        message: `Unknown field: ${field}`,
        value: dataObj[field],
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate CreateItemRequest
 */
export function validateCreateItemRequest(data: any): ValidationResult {
  const schema: ValidationSchema = {
    rules: [
      {
        field: 'name',
        required: true,
        type: 'string',
        minLength: 1,
        maxLength: 100,
        custom: (value) => isNonEmptyString(value) || 'Name cannot be empty',
      },
      {
        field: 'description',
        required: true,
        type: 'string',
        minLength: 1,
        maxLength: 500,
        custom: (value) => isNonEmptyString(value) || 'Description cannot be empty',
      },
    ],
    strict: true,
  };

  return validateSchema(data, schema);
}

/**
 * Validate UpdateItemRequest
 */
export function validateUpdateItemRequest(data: any): ValidationResult {
  const schema: ValidationSchema = {
    rules: [
      {
        field: 'name',
        required: false,
        type: 'string',
        minLength: 1,
        maxLength: 100,
        custom: (value) => !isDefined(value) || isNonEmptyString(value) || 'Name cannot be empty',
      },
      {
        field: 'description',
        required: false,
        type: 'string',
        minLength: 1,
        maxLength: 500,
        custom: (value) => !isDefined(value) || isNonEmptyString(value) || 'Description cannot be empty',
      },
      {
        field: 'status',
        required: false,
        type: 'string',
        enum: ['active', 'inactive'],
      },
    ],
    strict: true,
  };

  return validateSchema(data, schema);
}

/**
 * Validate item ID parameter
 */
export function validateItemId(id: any): ValidationResult {
  const errors: ValidationErrorDetail[] = [];

  if (!isDefined(id)) {
    errors.push({
      field: 'id',
      message: 'Item ID is required',
      value: id,
    });
  } else if (!isString(id)) {
    errors.push({
      field: 'id',
      message: 'Item ID must be a string',
      value: id,
    });
  } else if (!isNonEmptyString(id)) {
    errors.push({
      field: 'id',
      message: 'Item ID cannot be empty',
      value: id,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate query parameters for listing items
 */
export function validateListQueryParams(params: any): ValidationResult {
  const schema: ValidationSchema = {
    rules: [
      {
        field: 'limit',
        required: false,
        type: 'string',
        custom: (value) => {
          if (!isDefined(value)) return true;
          const num = parseInt(value, 10);
          return (!isNaN(num) && num > 0 && num <= 100) || 'Limit must be a number between 1 and 100';
        },
      },
      {
        field: 'offset',
        required: false,
        type: 'string',
        custom: (value) => {
          if (!isDefined(value)) return true;
          const num = parseInt(value, 10);
          return (!isNaN(num) && num >= 0) || 'Offset must be a non-negative number';
        },
      },
      {
        field: 'status',
        required: false,
        type: 'string',
        enum: ['active', 'inactive'],
      },
    ],
    strict: false, // Allow other query parameters
  };

  return validateSchema(params || {}, schema);
}

/**
 * Parse and validate JSON body
 */
export function parseAndValidateJson(body: string | null): { data: any; error?: string } {
  if (!body) {
    return { data: null, error: 'Request body is required' };
  }

  try {
    const data = JSON.parse(body);
    return { data };
  } catch (error) {
    return { data: null, error: 'Invalid JSON format' };
  }
}