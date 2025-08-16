// Unit tests for items handlers

import { APIGatewayProxyEvent, Context } from 'aws-lambda';

// Mock all the utility functions before importing handlers
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  logRequestEnd: jest.fn(),
  logLambdaStart: jest.fn(),
  logLambdaEnd: jest.fn(),
};

const mockCreateSuccessResponse = jest.fn((data, message, statusCode = 200) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  body: JSON.stringify({ success: true, data, message }),
}));

const mockCreateErrorResponse = jest.fn((error, message, statusCode = 500) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  body: JSON.stringify({ success: false, error, message }),
}));

const mockHandleError = jest.fn((error) => ({
  statusCode: 500,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  body: JSON.stringify({ success: false, error: 'Internal server error' }),
}));

const mockValidationResult = { isValid: true, errors: [] };

jest.mock('../../../src/lambda/utils', () => ({
  createRequestLogger: jest.fn(() => mockLogger),
  createSuccessResponse: mockCreateSuccessResponse,
  createErrorResponse: mockCreateErrorResponse,
  handleError: mockHandleError,
  withErrorHandling: jest.fn((handler) => handler),
  getQueryParameters: jest.fn(),
  getPathParameters: jest.fn(),
  getJsonBody: jest.fn(),
  isCorsPreflightRequest: jest.fn(() => false),
  handleCorsPreflightRequest: jest.fn(() => ({
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: '',
  })),
  validateListQueryParams: jest.fn(() => mockValidationResult),
  validateItemId: jest.fn(() => mockValidationResult),
  validateCreateItemRequest: jest.fn(() => mockValidationResult),
  validateUpdateItemRequest: jest.fn(() => mockValidationResult),
  createValidationError: jest.fn((errors) => {
    const error = new Error('Validation failed');
    (error as any).statusCode = 400;
    return error;
  }),
  assertExists: jest.fn(),
  NotFoundError: class NotFoundError extends Error {
    statusCode = 404;
    constructor(message: string) {
      super(message);
    }
  },
  parseInteger: jest.fn((value, defaultValue) => {
    if (value === '10') return 10;
    if (value === '0') return 0;
    return defaultValue;
  }),
}));

// Import handlers after mocking
import { listItems, getItem, createItem, updateItem, deleteItem } from '../../../src/lambda/handlers/items';

// Create mock event and context
const createMockEvent = (overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent => ({
  body: null,
  headers: {},
  multiValueHeaders: {},
  httpMethod: 'GET',
  isBase64Encoded: false,
  path: '/items',
  pathParameters: null,
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  stageVariables: null,
  requestContext: {
    accountId: '123456789012',
    apiId: 'test-api',
    authorizer: {},
    httpMethod: 'GET',
    identity: {
      accessKey: null,
      accountId: null,
      apiKey: null,
      apiKeyId: null,
      caller: null,
      clientCert: null,
      cognitoAuthenticationProvider: null,
      cognitoAuthenticationType: null,
      cognitoIdentityId: null,
      cognitoIdentityPoolId: null,
      principalOrgId: null,
      sourceIp: '127.0.0.1',
      user: null,
      userAgent: 'test-agent',
      userArn: null,
    },
    path: '/items',
    protocol: 'HTTP/1.1',
    requestId: 'test-request-id',
    requestTime: '01/Jan/2024:00:00:00 +0000',
    requestTimeEpoch: 1704067200,
    resourceId: 'test-resource',
    resourcePath: '/items',
    stage: 'test',
  },
  resource: '/items',
  ...overrides,
});

const createMockContext = (): Context => ({
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'test-function',
  functionVersion: '1',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
  memoryLimitInMB: '128',
  awsRequestId: 'test-aws-request-id',
  logGroupName: '/aws/lambda/test-function',
  logStreamName: '2024/01/01/[$LATEST]test-stream',
  getRemainingTimeInMillis: () => 30000,
  done: jest.fn(),
  fail: jest.fn(),
  succeed: jest.fn(),
});

describe('Items Handlers', () => {
  let mockEvent: APIGatewayProxyEvent;
  let mockContext: Context;

  beforeEach(() => {
    mockEvent = createMockEvent();
    mockContext = createMockContext();
    jest.clearAllMocks();
  });

  describe('listItems', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return list of items successfully', async () => {
      const { getQueryParameters } = require('../../../src/lambda/utils');
      
      getQueryParameters.mockReturnValue({ limit: '10', offset: '0' });

      const result = await listItems(mockEvent, mockContext);

      expect(result.statusCode).toBe(200);
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        expect.any(Array),
        'Items retrieved successfully'
      );
    });

    it('should handle validation errors', async () => {
      const { validateListQueryParams, createValidationError } = require('../../../src/lambda/utils');
      
      validateListQueryParams.mockReturnValue({
        isValid: false,
        errors: [{ field: 'limit', message: 'Invalid limit' }],
      });

      try {
        await listItems(mockEvent, mockContext);
      } catch (error) {
        // Expected to throw validation error
      }

      expect(createValidationError).toHaveBeenCalledWith([
        { field: 'limit', message: 'Invalid limit' },
      ]);
    });

    it('should handle CORS preflight requests', async () => {
      const { isCorsPreflightRequest, handleCorsPreflightRequest } = require('../../../src/lambda/utils');
      
      isCorsPreflightRequest.mockReturnValue(true);
      handleCorsPreflightRequest.mockReturnValue({
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: '',
      });

      const result = await listItems(mockEvent, mockContext);

      expect(handleCorsPreflightRequest).toHaveBeenCalled();
      expect(result.statusCode).toBe(200);
    });

    it('should apply pagination correctly', async () => {
      const { getQueryParameters } = require('../../../src/lambda/utils');
      
      getQueryParameters.mockReturnValue({ limit: '2', offset: '1' });

      const result = await listItems(mockEvent, mockContext);

      expect(result.statusCode).toBe(200);
      expect(mockCreateSuccessResponse).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      const { getQueryParameters } = require('../../../src/lambda/utils');
      
      getQueryParameters.mockReturnValue({ status: 'active' });

      const result = await listItems(mockEvent, mockContext);

      expect(result.statusCode).toBe(200);
      expect(mockCreateSuccessResponse).toHaveBeenCalled();
    });
  });

  describe('getItem', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return a specific item successfully', async () => {
      const { getPathParameters } = require('../../../src/lambda/utils');
      
      getPathParameters.mockReturnValue({ id: '1' });

      const result = await getItem(mockEvent, mockContext);

      expect(result.statusCode).toBe(200);
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        expect.objectContaining({ id: '1' }),
        'Item retrieved successfully'
      );
    });

    it('should handle item not found', async () => {
      const { getPathParameters } = require('../../../src/lambda/utils');
      
      getPathParameters.mockReturnValue({ id: '999' });

      const result = await getItem(mockEvent, mockContext);

      // Should return error response for non-existent item
      expect(mockHandleError).toHaveBeenCalled();
    });

    it('should validate item ID', async () => {
      const { getPathParameters, validateItemId, createValidationError } = require('../../../src/lambda/utils');
      
      getPathParameters.mockReturnValue({ id: '' });
      validateItemId.mockReturnValue({
        isValid: false,
        errors: [{ field: 'id', message: 'Item ID cannot be empty' }],
      });

      try {
        await getItem(mockEvent, mockContext);
      } catch (error) {
        // Expected to throw validation error
      }

      expect(createValidationError).toHaveBeenCalledWith([
        { field: 'id', message: 'Item ID cannot be empty' },
      ]);
    });

    it('should handle missing path parameters', async () => {
      const { getPathParameters, assertExists } = require('../../../src/lambda/utils');
      
      getPathParameters.mockReturnValue(null);
      assertExists.mockImplementation(() => {
        throw new Error('Path parameters are required');
      });

      try {
        await getItem(mockEvent, mockContext);
      } catch (error) {
        expect(error.message).toBe('Path parameters are required');
      }

      expect(assertExists).toHaveBeenCalled();
    });
  });

  describe('createItem', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should create a new item successfully', async () => {
      const { getJsonBody } = require('../../../src/lambda/utils');
      
      const newItemData = {
        name: 'Test Item',
        description: 'Test Description',
      };

      getJsonBody.mockReturnValue(newItemData);

      const result = await createItem(mockEvent, mockContext);

      expect(result.statusCode).toBe(201);
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Item',
          description: 'Test Description',
          status: 'active',
        }),
        'Item created successfully',
        201
      );
    });

    it('should validate create item request', async () => {
      const { getJsonBody, validateCreateItemRequest, createValidationError } = require('../../../src/lambda/utils');
      
      getJsonBody.mockReturnValue({ name: '' });
      validateCreateItemRequest.mockReturnValue({
        isValid: false,
        errors: [{ field: 'name', message: 'Name cannot be empty' }],
      });

      try {
        await createItem(mockEvent, mockContext);
      } catch (error) {
        // Expected to throw validation error
      }

      expect(createValidationError).toHaveBeenCalledWith([
        { field: 'name', message: 'Name cannot be empty' },
      ]);
    });

    it('should handle missing request body', async () => {
      const { getJsonBody, assertExists } = require('../../../src/lambda/utils');
      
      getJsonBody.mockReturnValue(null);
      assertExists.mockImplementation(() => {
        throw new Error('Request body is required');
      });

      try {
        await createItem(mockEvent, mockContext);
      } catch (error) {
        expect(error.message).toBe('Request body is required');
      }

      expect(assertExists).toHaveBeenCalled();
    });

    it('should generate unique ID for new items', async () => {
      const { getJsonBody } = require('../../../src/lambda/utils');
      
      const newItemData = {
        name: 'Test Item',
        description: 'Test Description',
      };

      getJsonBody.mockReturnValue(newItemData);

      const result = await createItem(mockEvent, mockContext);

      expect(result.statusCode).toBe(201);
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
        'Item created successfully',
        201
      );
    });
  });

  describe('updateItem', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should update an existing item successfully', async () => {
      const { getPathParameters, getJsonBody } = require('../../../src/lambda/utils');
      
      const updateData = {
        name: 'Updated Item',
        status: 'inactive' as const,
      };

      getPathParameters.mockReturnValue({ id: '1' });
      getJsonBody.mockReturnValue(updateData);

      const result = await updateItem(mockEvent, mockContext);

      expect(result.statusCode).toBe(200);
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          name: 'Updated Item',
          status: 'inactive',
        }),
        'Item updated successfully'
      );
    });

    it('should handle partial updates', async () => {
      const { getPathParameters, getJsonBody } = require('../../../src/lambda/utils');
      
      const updateData = {
        name: 'Partially Updated Item',
      };

      getPathParameters.mockReturnValue({ id: '1' });
      getJsonBody.mockReturnValue(updateData);

      const result = await updateItem(mockEvent, mockContext);

      expect(result.statusCode).toBe(200);
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          name: 'Partially Updated Item',
          updatedAt: expect.any(String),
        }),
        'Item updated successfully'
      );
    });

    it('should handle item not found for update', async () => {
      const { getPathParameters, getJsonBody } = require('../../../src/lambda/utils');
      
      getPathParameters.mockReturnValue({ id: '999' });
      getJsonBody.mockReturnValue({ name: 'Updated Item' });

      const result = await updateItem(mockEvent, mockContext);

      expect(mockHandleError).toHaveBeenCalled();
    });

    it('should validate update request', async () => {
      const { getPathParameters, getJsonBody, validateUpdateItemRequest, createValidationError } = require('../../../src/lambda/utils');
      
      getPathParameters.mockReturnValue({ id: '1' });
      getJsonBody.mockReturnValue({ name: '' });
      validateUpdateItemRequest.mockReturnValue({
        isValid: false,
        errors: [{ field: 'name', message: 'Name cannot be empty' }],
      });

      try {
        await updateItem(mockEvent, mockContext);
      } catch (error) {
        // Expected to throw validation error
      }

      expect(createValidationError).toHaveBeenCalledWith([
        { field: 'name', message: 'Name cannot be empty' },
      ]);
    });
  });

  describe('deleteItem', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should delete an existing item successfully', async () => {
      const { getPathParameters } = require('../../../src/lambda/utils');
      
      getPathParameters.mockReturnValue({ id: '1' });

      const result = await deleteItem(mockEvent, mockContext);

      expect(result.statusCode).toBe(200);
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        { id: '1' },
        'Item deleted successfully'
      );
    });

    it('should handle item not found for deletion', async () => {
      const { getPathParameters } = require('../../../src/lambda/utils');
      
      getPathParameters.mockReturnValue({ id: '999' });

      const result = await deleteItem(mockEvent, mockContext);

      expect(mockHandleError).toHaveBeenCalled();
    });

    it('should validate item ID for deletion', async () => {
      const { getPathParameters, validateItemId, createValidationError } = require('../../../src/lambda/utils');
      
      getPathParameters.mockReturnValue({ id: '' });
      validateItemId.mockReturnValue({
        isValid: false,
        errors: [{ field: 'id', message: 'Item ID cannot be empty' }],
      });

      try {
        await deleteItem(mockEvent, mockContext);
      } catch (error) {
        // Expected to throw validation error
      }

      expect(createValidationError).toHaveBeenCalledWith([
        { field: 'id', message: 'Item ID cannot be empty' },
      ]);
    });

    it('should remove item from store', async () => {
      const { getPathParameters } = require('../../../src/lambda/utils');
      
      getPathParameters.mockReturnValue({ id: '2' });

      const result = await deleteItem(mockEvent, mockContext);

      expect(result.statusCode).toBe(200);
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        { id: '2' },
        'Item deleted successfully'
      );
    });
  });
});