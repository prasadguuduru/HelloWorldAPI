// Integration tests for performance and load testing

import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { listItems, getItem, createItem, updateItem, deleteItem } from '../../../src/lambda/handlers/items';

// Helper to create performance test events
const createPerformanceTestEvent = (overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent => ({
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
            userAgent: 'performance-test-agent',
            userArn: null,
        },
        path: '/items',
        protocol: 'HTTP/1.1',
        requestId: 'perf-test-request-id',
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
    memoryLimitInMB: '256',
    awsRequestId: 'perf-test-aws-request-id',
    logGroupName: '/aws/lambda/test-function',
    logStreamName: '2024/01/01/[$LATEST]perf-test-stream',
    getRemainingTimeInMillis: () => 30000,
    done: jest.fn(),
    fail: jest.fn(),
    succeed: jest.fn(),
});

// Helper to measure execution time
const measureExecutionTime = async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
    const startTime = Date.now();
    const result = await fn();
    const duration = Date.now() - startTime;
    return { result, duration };
};

describe('Performance Integration Tests', () => {
    let mockContext: Context;

    beforeEach(() => {
        mockContext = createTestContext();
    });

    describe('Response Time Tests', () => {
        it('should respond to GET /items within acceptable time', async () => {
            const event = createPerformanceTestEvent();

            const { result, duration } = await measureExecutionTime(() =>
                listItems(event, mockContext)
            );

            expect(result.statusCode).toBe(200);
            expect(duration).toBeLessThan(1000); // Should respond within 1 second
        });

        it('should respond to GET /items/{id} within acceptable time', async () => {
            const event = createPerformanceTestEvent({
                httpMethod: 'GET',
                pathParameters: { id: '1' },
            });

            const { result, duration } = await measureExecutionTime(() =>
                getItem(event, mockContext)
            );

            expect(result.statusCode).toBe(200);
            expect(duration).toBeLessThan(500); // Should respond within 500ms
        });

        it('should respond to POST /items within acceptable time', async () => {
            const event = createPerformanceTestEvent({
                httpMethod: 'POST',
                body: JSON.stringify({
                    name: 'Performance Test Item',
                    description: 'Testing response time',
                }),
            });

            const { result, duration } = await measureExecutionTime(() =>
                createItem(event, mockContext)
            );

            expect(result.statusCode).toBe(201);
            expect(duration).toBeLessThan(1000); // Should respond within 1 second
        });
    });

    describe('Concurrent Request Tests', () => {
        it('should handle multiple concurrent GET requests', async () => {
            const event = createPerformanceTestEvent();
            const concurrentRequests = 10;

            const promises = Array.from({ length: concurrentRequests }, () =>
                listItems(event, mockContext)
            );

            const { result: results, duration } = await measureExecutionTime(() =>
                Promise.all(promises)
            );

            // All requests should succeed
            results.forEach(result => {
                expect(result.statusCode).toBe(200);
            });

            // Total time should be reasonable (not much more than single request)
            expect(duration).toBeLessThan(2000);
        });

        it('should handle concurrent create requests', async () => {
            const concurrentRequests = 5;

            const promises = Array.from({ length: concurrentRequests }, (_, index) => {
                const event = createPerformanceTestEvent({
                    httpMethod: 'POST',
                    body: JSON.stringify({
                        name: `Concurrent Item ${index}`,
                        description: `Created in concurrent test ${index}`,
                    }),
                });
                return createItem(event, mockContext);
            });

            const results = await Promise.all(promises);

            // All requests should succeed
            results.forEach(result => {
                expect(result.statusCode).toBe(201);
                const body = JSON.parse(result.body);
                expect(body.success).toBe(true);
                expect(body.data).toHaveProperty('id');
            });

            // Each item should have a unique ID
            const ids = results.map(result => JSON.parse(result.body).data.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(concurrentRequests);
        });
    });

    describe('Large Payload Tests', () => {
        it('should handle large item descriptions', async () => {
            const largeDescription = 'A'.repeat(1000); // 1KB description
            const event = createPerformanceTestEvent({
                httpMethod: 'POST',
                body: JSON.stringify({
                    name: 'Large Payload Item',
                    description: largeDescription,
                }),
            });

            const { result, duration } = await measureExecutionTime(() =>
                createItem(event, mockContext)
            );

            expect(result.statusCode).toBe(201);
            expect(duration).toBeLessThan(1500); // Should handle large payload within 1.5 seconds

            const body = JSON.parse(result.body);
            expect(body.data.description).toBe(largeDescription);
        });

        it('should handle requests with many query parameters', async () => {
            const event = createPerformanceTestEvent({
                queryStringParameters: {
                    limit: '50',
                    offset: '0',
                    status: 'active',
                    // Add some additional parameters to test parsing
                    sort: 'name',
                    order: 'asc',
                    filter: 'test',
                },
            });

            const { result, duration } = await measureExecutionTime(() =>
                listItems(event, mockContext)
            );

            expect(result.statusCode).toBe(200);
            expect(duration).toBeLessThan(1000);
        });
    });

    describe('Memory Usage Tests', () => {
        it('should handle pagination efficiently', async () => {
            // Test different page sizes to ensure memory usage is reasonable
            const pageSizes = [1, 10, 50, 100];

            for (const pageSize of pageSizes) {
                const event = createPerformanceTestEvent({
                    queryStringParameters: {
                        limit: pageSize.toString(),
                        offset: '0',
                    },
                });

                const { result, duration } = await measureExecutionTime(() =>
                    listItems(event, mockContext)
                );

                expect(result.statusCode).toBe(200);
                expect(duration).toBeLessThan(1000);

                const body = JSON.parse(result.body);
                expect(body.data.length).toBeLessThanOrEqual(pageSize);
            }
        });

        it('should handle multiple updates efficiently', async () => {
            // Create an item first
            const createEvent = createPerformanceTestEvent({
                httpMethod: 'POST',
                body: JSON.stringify({
                    name: 'Update Test Item',
                    description: 'Item for update testing',
                }),
            });

            const createResult = await createItem(createEvent, mockContext);
            expect(createResult.statusCode).toBe(201);

            const createdItem = JSON.parse(createResult.body).data;

            // Perform multiple updates
            const updateCount = 5;
            const updatePromises = Array.from({ length: updateCount }, (_, index) => {
                const updateEvent = createPerformanceTestEvent({
                    httpMethod: 'PUT',
                    pathParameters: { id: createdItem.id },
                    body: JSON.stringify({
                        name: `Updated Item ${index}`,
                        description: `Updated description ${index}`,
                    }),
                });
                return updateItem(updateEvent, mockContext);
            });

            const { result: updateResults, duration } = await measureExecutionTime(() =>
                Promise.all(updatePromises)
            );

            // All updates should succeed
            updateResults.forEach(result => {
                expect(result.statusCode).toBe(200);
            });

            expect(duration).toBeLessThan(2000); // Should complete all updates within 2 seconds
        });
    });

    describe('Error Handling Performance', () => {
        it('should handle validation errors quickly', async () => {
            const event = createPerformanceTestEvent({
                httpMethod: 'POST',
                body: JSON.stringify({
                    // Missing required fields
                }),
            });

            const { result, duration } = await measureExecutionTime(() =>
                createItem(event, mockContext)
            );

            expect(result.statusCode).toBe(400);
            expect(duration).toBeLessThan(500); // Error handling should be fast
        });

        it('should handle not found errors quickly', async () => {
            const event = createPerformanceTestEvent({
                httpMethod: 'GET',
                pathParameters: { id: 'non-existent-id' },
            });

            const { result, duration } = await measureExecutionTime(() =>
                getItem(event, mockContext)
            );

            expect(result.statusCode).toBe(404);
            expect(duration).toBeLessThan(500); // Error handling should be fast
        });
    });

    describe('Cold Start Simulation', () => {
        it('should handle first request efficiently', async () => {
            // Simulate cold start by creating fresh context
            const coldStartContext = createTestContext();
            const event = createPerformanceTestEvent();

            const { result, duration } = await measureExecutionTime(() =>
                listItems(event, coldStartContext)
            );

            expect(result.statusCode).toBe(200);
            // Cold start might be slower, but should still be reasonable
            expect(duration).toBeLessThan(3000);
        });
    });
});