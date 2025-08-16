// Integration tests for error handling

import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { listItems, getItem, createItem, updateItem, deleteItem } from '../../../src/lambda/handlers/items';

// Helper to create integration test events
const createErrorTestEvent = (overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent => ({
  body: null,
  headers: {
    'Content-Type': 'application/json',
  },
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

const createTestContext = (): Context => ({
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

describe('Error Handling Integration Tests', () => {
  let mockContext: Context;

  beforeEach(() => {
    mockContext = createTestContext();
  });

  describe('Validation Errors', () => {
    it('should return 400 for invalid query parameters', async () => {
      const event = createErrorTestEvent({
        queryStringParameters: {
          limit: 'invalid',
          offset: '-1',
        },
      });

      const result = await listItems(event, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for missing required fields in POST', async () => {
      const event = createErrorTestEvent({
        httpMethod: 'POST',
        body: JSON.stringify({
          // Missing required name and description
        }),
      });

      const result = await createItem(event, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('VALIDATION_ERROR');
      expect(body.message).toContain('Validation failed');
    });

    it('should return 400 for empty required fields', async () => {
      const event = createErrorTestEvent({
        httpMethod: 'POST',
        body: JSON.stringify({
          name: '',
          description: '',
        }),
      });

      const result = await createItem(event, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.message).toContain('empty');
    });

    it('should return 400 for invalid JSON body', async () => {
      const event = createErrorTestEvent({
        httpMethod: 'POST',
        body: 'invalid json',
      });

      const result = await createItem(event, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
    });

    it('should return 400 for invalid status in update', async () => {
      const event = createErrorTestEvent({
        httpMethod: 'PUT',
        pathParameters: { id: '1' },
        body: JSON.stringify({
          status: 'invalid-status',
        }),
      });

      const result = await updateItem(event, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('VALIDATION_ERROR');
    });
  });

  describe('Not Found Errors', () => {
    it('should return 404 for non-existent item', async () => {
      const event = createErrorTestEvent({
        httpMethod: 'GET',
        pathParameters: { id: '999999' },
      });

      const result = await getItem(event, mockContext);

      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('NOT_FOUND');
      expect(body.message).toContain('not found');
    });

    it('should return 404 when updating non-existent item', async () => {
      const event = createErrorTestEvent({
        httpMethod: 'PUT',
        pathParameters: { id: '999999' },
        body: JSON.stringify({
          name: 'Updated Name',
        }),
      });

      const result = await updateItem(event, mockContext);

      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('NOT_FOUND');
    });

    it('should return 404 when deleting non-existent item', async () => {
      const event = createErrorTestEvent({
        httpMethod: 'DELETE',
        pathParameters: { id: '999999' },
      });

      const result = await deleteItem(event, mockContext);

      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('NOT_FOUND');
    });
  });

  describe('Missing Parameters', () => {
    it('should handle missing path parameters', async () => {
      const event = createErrorTestEvent({
        httpMethod: 'GET',
        pathParameters: null,
        resource: '/items/{id}',
      });

      const result = await getItem(event, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
    });

    it('should handle missing request body for POST', async () => {
      const event = createErrorTestEvent({
        httpMethod: 'POST',
        body: null,
      });

      const result = await createItem(event, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
    });

    it('should handle missing request body for PUT', async () => {
      const event = createErrorTestEvent({
        httpMethod: 'PUT',
        pathParameters: { id: '1' },
        body: null,
      });

      const result = await updateItem(event, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
    });
  });

  describe('Error Response Format', () => {
    it('should return consistent error response format', async () => {
      const event = createErrorTestEvent({
        httpMethod: 'GET',
        pathParameters: { id: '999' },
      });

      const result = await getItem(event, mockContext);

      expect(result.statusCode).toBe(404);
      expect(result.headers).toHaveProperty('Content-Type', 'application/json');
      expect(result.headers).toHaveProperty('Access-Control-Allow-Origin', '*');

      const body = JSON.parse(result.body);
      expect(body).toHaveProperty('success', false);
      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('message');
      expect(body).toHaveProperty('statusCode');
      expect(body).toHaveProperty('timestamp');
      expect(typeof body.timestamp).toBe('string');
    });

    it('should include proper error codes', async () => {
      const testCases = [
        {
          event: createErrorTestEvent({
            httpMethod: 'POST',
            body: JSON.stringify({ name: '' }),
          }),
          expectedError: 'VALIDATION_ERROR',
          expectedStatus: 400,
        },
        {
          event: createErrorTestEvent({
            httpMethod: 'GET',
            pathParameters: { id: '999' },
          }),
          expectedError: 'NOT_FOUND',
          expectedStatus: 404,
        },
      ];

      for (const testCase of testCases) {
        const result = testCase.event.httpMethod === 'POST' 
          ? await createItem(testCase.event, mockContext)
          : await getItem(testCase.event, mockContext);

        expect(result.statusCode).toBe(testCase.expectedStatus);
        const body = JSON.parse(result.body);
        expect(body.error).toBe(testCase.expectedError);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle extremely long item names', async () => {
      const longName = 'a'.repeat(1000);
      const event = createErrorTestEvent({
        httpMethod: 'POST',
        body: JSON.stringify({
          name: longName,
          description: 'Test description',
        }),
      });

      const result = await createItem(event, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('VALIDATION_ERROR');
    });

    it('should handle special characters in item ID', async () => {
      const event = createErrorTestEvent({
        httpMethod: 'GET',
        pathParameters: { id: 'special!@#$%^&*()' },
      });

      const result = await getItem(event, mockContext);

      // Should either find the item or return 404, but not crash
      expect([200, 404]).toContain(result.statusCode);
    });

    it('should handle Unicode characters in request body', async () => {
      const event = createErrorTestEvent({
        httpMethod: 'POST',
        body: JSON.stringify({
          name: '测试项目 🚀',
          description: 'Unicode description with émojis 🎉',
        }),
      });

      const result = await createItem(event, mockContext);

      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('测试项目 🚀');
    });
  });
});