// Integration tests for CORS functionality

import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { listItems, getItem, createItem, updateItem, deleteItem } from '../../../src/lambda/handlers/items';

// Helper to create integration test events
const createCorsTestEvent = (overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent => ({
  body: null,
  headers: {
    'Content-Type': 'application/json',
    'Origin': 'https://example.com',
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
      userAgent: 'Mozilla/5.0 (compatible; test)',
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

describe('CORS Integration Tests', () => {
  let mockContext: Context;

  beforeEach(() => {
    mockContext = createTestContext();
  });

  describe('OPTIONS requests', () => {
    it('should handle OPTIONS request for /items', async () => {
      const event = createCorsTestEvent({
        httpMethod: 'OPTIONS',
        path: '/items',
      });

      const result = await listItems(event, mockContext);

      expect(result.statusCode).toBe(200);
      expect(result.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
      expect(result.headers).toHaveProperty('Access-Control-Allow-Methods');
      expect(result.headers).toHaveProperty('Access-Control-Allow-Headers');
      expect(result.headers).toHaveProperty('Access-Control-Max-Age');
      expect(result.body).toBe('');
    });

    it('should handle OPTIONS request for /items/{id}', async () => {
      const event = createCorsTestEvent({
        httpMethod: 'OPTIONS',
        path: '/items/1',
        pathParameters: { id: '1' },
      });

      const result = await getItem(event, mockContext);

      expect(result.statusCode).toBe(200);
      expect(result.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
      expect(result.headers).toHaveProperty('Access-Control-Allow-Methods');
      expect(result.headers).toHaveProperty('Access-Control-Allow-Headers');
      expect(result.body).toBe('');
    });
  });

  describe('CORS headers on regular requests', () => {
    it('should include CORS headers in GET responses', async () => {
      const event = createCorsTestEvent({
        httpMethod: 'GET',
        path: '/items',
      });

      const result = await listItems(event, mockContext);

      expect(result.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
      expect(result.headers).toHaveProperty('Content-Type', 'application/json');
    });

    it('should include CORS headers in POST responses', async () => {
      const event = createCorsTestEvent({
        httpMethod: 'POST',
        path: '/items',
        body: JSON.stringify({
          name: 'Test Item',
          description: 'Test Description',
        }),
      });

      const result = await createItem(event, mockContext);

      expect(result.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
      expect(result.headers).toHaveProperty('Content-Type', 'application/json');
    });

    it('should include CORS headers in error responses', async () => {
      const event = createCorsTestEvent({
        httpMethod: 'GET',
        path: '/items/999',
        pathParameters: { id: '999' },
      });

      const result = await getItem(event, mockContext);

      expect(result.statusCode).toBe(404);
      expect(result.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
      expect(result.headers).toHaveProperty('Content-Type', 'application/json');
    });
  });

  describe('Cross-origin request simulation', () => {
    it('should handle requests from different origins', async () => {
      const origins = [
        'https://example.com',
        'https://app.example.com',
        'http://localhost:3000',
      ];

      for (const origin of origins) {
        const event = createCorsTestEvent({
          headers: {
            'Content-Type': 'application/json',
            'Origin': origin,
          },
        });

        const result = await listItems(event, mockContext);

        expect(result.statusCode).toBe(200);
        expect(result.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
      }
    });

    it('should handle requests with various headers', async () => {
      const event = createCorsTestEvent({
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token123',
          'X-Requested-With': 'XMLHttpRequest',
          'Origin': 'https://example.com',
        },
      });

      const result = await listItems(event, mockContext);

      expect(result.statusCode).toBe(200);
      expect(result.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    });
  });

  describe('Preflight request validation', () => {
    it('should validate allowed methods in preflight', async () => {
      const event = createCorsTestEvent({
        httpMethod: 'OPTIONS',
        headers: {
          'Origin': 'https://example.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type',
        },
      });

      const result = await listItems(event, mockContext);

      expect(result.statusCode).toBe(200);
      const allowedMethods = result.headers['Access-Control-Allow-Methods'];
      expect(allowedMethods).toContain('POST');
      expect(allowedMethods).toContain('GET');
      expect(allowedMethods).toContain('PUT');
      expect(allowedMethods).toContain('DELETE');
      expect(allowedMethods).toContain('OPTIONS');
    });

    it('should validate allowed headers in preflight', async () => {
      const event = createCorsTestEvent({
        httpMethod: 'OPTIONS',
        headers: {
          'Origin': 'https://example.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, Authorization',
        },
      });

      const result = await listItems(event, mockContext);

      expect(result.statusCode).toBe(200);
      const allowedHeaders = result.headers['Access-Control-Allow-Headers'];
      expect(allowedHeaders).toContain('Content-Type');
      expect(allowedHeaders).toContain('Authorization');
      expect(allowedHeaders).toContain('X-Requested-With');
    });
  });
});