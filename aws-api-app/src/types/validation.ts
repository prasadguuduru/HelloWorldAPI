// Validation type definitions

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationErrorDetail[];
}

/**
 * Validation error details
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: any;
}

/**
 * Field validation rule
 */
export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => boolean | string;
}

/**
 * Schema validation configuration
 */
export interface ValidationSchema {
  rules: ValidationRule[];
  strict?: boolean; // If true, reject unknown fields
}

/**
 * Type guard for checking if a value is a string
 */
export function isString(value: any): value is string {
  return typeof value === 'string';
}

/**
 * Type guard for checking if a value is a number
 */
export function isNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Type guard for checking if a value is a boolean
 */
export function isBoolean(value: any): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Type guard for checking if a value is an array
 */
export function isArray(value: any): value is any[] {
  return Array.isArray(value);
}

/**
 * Type guard for checking if a value is an object
 */
export function isObject(value: any): value is object {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard for checking if a value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard for checking if a string is not empty
 */
export function isNonEmptyString(value: any): value is string {
  return isString(value) && value.trim().length > 0;
}

/**
 * Type guard for checking if a value is a valid UUID
 */
export function isUUID(value: any): value is string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return isString(value) && uuidRegex.test(value);
}