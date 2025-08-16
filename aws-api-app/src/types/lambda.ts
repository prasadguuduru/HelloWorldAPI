// Lambda function type definitions

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

/**
 * Lambda handler function signature
 */
export type LambdaHandler = (
  event: APIGatewayProxyEvent,
  context: Context
) => Promise<APIGatewayProxyResult>;

/**
 * Extended API Gateway event with typed path parameters
 */
export interface TypedAPIGatewayProxyEvent<TPathParams = any, TQueryParams = any, TBody = any>
  extends Omit<APIGatewayProxyEvent, 'pathParameters' | 'queryStringParameters' | 'body'> {
  pathParameters: TPathParams;
  queryStringParameters: TQueryParams;
  body: TBody;
}

/**
 * Standard API response structure
 */
export interface APIResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

/**
 * CORS headers configuration
 */
export interface CorsHeaders {
  [header: string]: string;
  'Access-Control-Allow-Origin': string;
  'Access-Control-Allow-Methods': string;
  'Access-Control-Allow-Headers': string;
  'Access-Control-Max-Age': string;
}

/**
 * Lambda function configuration
 */
export interface LambdaConfig {
  functionName: string;
  runtime: string;
  handler: string;
  timeout: number;
  memorySize: number;
  environment?: Record<string, string>;
}

/**
 * Lambda execution context with additional typing
 */
export interface ExtendedContext extends Context {
  requestId: string;
  functionName: string;
  functionVersion: string;
  invokedFunctionArn: string;
  memoryLimitInMB: string;
  awsRequestId: string;
}