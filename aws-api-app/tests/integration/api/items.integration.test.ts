// Integration tests for items API endpoints

import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { listItems, getItem, createItem, updateItem, deleteItem } from '../../../src/lambda/handlers/items';

// Create a more complete mock event
const createIntegrationEvent = (overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent => ({
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

const createIntegrationContext = (): Context => ({
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

describe('Items API Integration Tests', () => {
  let mockContext: Context;

  beforeEach(() => {
    mockContext = createIntegrationContext();
  });

  describe('listItems', () => {
    it('should return a list of items', async () => {
      const event = createIntegrationEvent({
        httpMethod: 'GET',
        path: '/items',
      });

      const result = await listItems(event, mockContext);

      expect(result.statusCode).toBe(200);
      expect(result.headers).toHaveProperty('Content-Type', 'application/json');
      
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('should handle query parameters', async () => {
      const event = createIntegrationEvent({
        httpMethod: 'GET',
        path: '/items',
        queryStringParameters: {
          limit: '5',
          status: 'active',
        },
      });

      const result = await listItems(event, mockContext);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  describe('getItem', () => {
    it('should return a specific item', async () => {
      const event = createIntegrationEvent({
        httpMethod: 'GET',
        path: '/items/1',
        pathParameters: { id: '1' },
      });

      const result = await getItem(event, mockContext);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('id', '1');
    });

    it('should return 404 for non-existent item', async () => {
      const event = createIntegrationEvent({
        httpMethod: 'GET',
        path: '/items/999',
        pathParameters: { id: '999' },
      });

      const result = await getItem(event, mockContext);

      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
    });
  });

  describe('createItem', () => {
    it('should create a new item', async () => {
      const newItem = {
        name: 'Test Item',
        description: 'Test Description',
      };

      const event = createIntegrationEvent({
        httpMethod: 'POST',
        path: '/items',
        body: JSON.stringify(newItem),
      });

      const result = await createItem(event, mockContext);

      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('name', 'Test Item');
      expect(body.data).toHaveProperty('description', 'Test Description');
      expect(body.data).toHaveProperty('status', 'active');
    });

    it('should validate required fields', async () => {
      const invalidItem = {
        name: '', // Empty name should fail validation
      };

      const event = createIntegrationEvent({
        httpMethod: 'POST',
        path: '/items',
        body: JSON.stringify(invalidItem),
      });

      const result = await createItem(event, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
    });
  });

  describe('updateItem', () => {
    it('should update an existing item', async () => {
      const updateData = {
        name: 'Updated Item',
        status: 'inactive' as const,
      };

      const event = createIntegrationEvent({
        httpMethod: 'PUT',
        path: '/items/1',
        pathParameters: { id: '1' },
        body: JSON.stringify(updateData),
      });

      const result = await updateItem(event, mockContext);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('name', 'Updated Item');
      expect(body.data).toHaveProperty('status', 'inactive');
    });
  });

  describe('deleteItem', () => {
    it('should delete an existing item', async () => {
      const event = createIntegrationEvent({
        httpMethod: 'DELETE',
        path: '/items/2',
        pathParameters: { id: '2' },
      });

      const result = await deleteItem(event, mockContext);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('id', '2');
    });
  });

  describe('CORS handling', () => {
    it('should handle OPTIONS requests', async () => {
      const event = createIntegrationEvent({
        httpMethod: 'OPTIONS',
        path: '/items',
      });

      const result = await listItems(event, mockContext);

      expect(result.statusCode).toBe(200);
      expect(result.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
      expect(result.headers).toHaveProperty('Access-Control-Allow-Methods');
    });
  });
});