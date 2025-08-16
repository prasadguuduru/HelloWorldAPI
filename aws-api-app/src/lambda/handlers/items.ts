// Lambda handlers for items API endpoints

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import {
  Item,
  ItemListResponse,
  ItemResponse,
  ItemQueryParams,
  ItemPathParams,
  CreateItemRequest,
  UpdateItemRequest,
  LambdaHandler,
} from '../../types';
import {
  createSuccessResponse,
  createRequestLogger,
  handleError,
  withErrorHandling,
  getQueryParameters,
  getPathParameters,
  getJsonBody,
  isCorsPreflightRequest,
  handleCorsPreflightRequest,
  validateListQueryParams,
  validateItemId,
  validateCreateItemRequest,
  validateUpdateItemRequest,
  createValidationError,
  assertExists,
  NotFoundError,
  parseInteger,
} from '../utils';

// Mock data store - In a real application, this would be a database
let itemsStore: Item[] = [
  {
    id: '1',
    name: 'Sample Item 1',
    description: 'This is a sample item for testing',
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    name: 'Sample Item 2',
    description: 'Another sample item',
    status: 'inactive',
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
  {
    id: '3',
    name: 'Sample Item 3',
    description: 'Third sample item',
    status: 'active',
    createdAt: '2024-01-03T00:00:00.000Z',
    updatedAt: '2024-01-03T00:00:00.000Z',
  },
];

/**
 * GET /items - List all items with optional filtering and pagination
 */
export const listItems: LambdaHandler = withErrorHandling(
  async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const logger = createRequestLogger(event, context);
    const startTime = Date.now();

    try {
      // Handle CORS preflight
      if (isCorsPreflightRequest(event)) {
        return handleCorsPreflightRequest();
      }

      // Extract and validate query parameters
      const queryParams = getQueryParameters<ItemQueryParams>(event);
      const validationResult = validateListQueryParams(queryParams);

      if (!validationResult.isValid) {
        logger.warn('Invalid query parameters', { errors: validationResult.errors });
        throw createValidationError(validationResult.errors);
      }

      // Parse pagination parameters
      const limit = parseInteger(queryParams?.limit, 10, 1, 100);
      const offset = parseInteger(queryParams?.offset, 0, 0);
      const statusFilter = queryParams?.status;

      logger.info('Listing items', { limit, offset, statusFilter });

      // Filter items by status if provided
      let filteredItems = itemsStore;
      if (statusFilter) {
        filteredItems = itemsStore.filter(item => item.status === statusFilter);
      }

      // Apply pagination
      const paginatedItems = filteredItems.slice(offset, offset + limit);

      // Log the operation
      const duration = Date.now() - startTime;
      logger.logRequestEnd('GET', '/items', 200, duration);
      logger.info('Items retrieved successfully', {
        totalItems: filteredItems.length,
        returnedItems: paginatedItems.length,
        limit,
        offset,
      });

      // Return success response
      return createSuccessResponse<Item[]>(paginatedItems, 'Items retrieved successfully');

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to list items', error as Error, { duration });
      return handleError(error);
    }
  }
);

/**
 * GET /items/{id} - Get a specific item by ID
 */
export const getItem: LambdaHandler = withErrorHandling(
  async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const logger = createRequestLogger(event, context);
    const startTime = Date.now();

    try {
      // Handle CORS preflight
      if (isCorsPreflightRequest(event)) {
        return handleCorsPreflightRequest();
      }

      // Extract and validate path parameters
      const pathParams = getPathParameters<ItemPathParams>(event);
      assertExists(pathParams, 'Path parameters are required');

      const validationResult = validateItemId(pathParams.id);
      if (!validationResult.isValid) {
        logger.warn('Invalid item ID', { id: pathParams.id, errors: validationResult.errors });
        throw createValidationError(validationResult.errors);
      }

      const itemId = pathParams.id;
      logger.info('Getting item', { itemId });

      // Find the item
      const item = itemsStore.find(item => item.id === itemId);
      if (!item) {
        logger.warn('Item not found', { itemId });
        throw new NotFoundError(`Item with ID ${itemId} not found`);
      }

      // Log the operation
      const duration = Date.now() - startTime;
      logger.logRequestEnd('GET', `/items/${itemId}`, 200, duration);
      logger.info('Item retrieved successfully', { itemId, itemName: item.name });

      // Return success response
      return createSuccessResponse<Item>(item, 'Item retrieved successfully');

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to get item', error as Error, { duration });
      return handleError(error);
    }
  }
);

/**
 * POST /items - Create a new item
 */
export const createItem: LambdaHandler = withErrorHandling(
  async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const logger = createRequestLogger(event, context);
    const startTime = Date.now();

    try {
      // Handle CORS preflight
      if (isCorsPreflightRequest(event)) {
        return handleCorsPreflightRequest();
      }

      // Extract and validate request body
      const requestBody = getJsonBody<CreateItemRequest>(event);
      assertExists(requestBody, 'Request body is required');

      const validationResult = validateCreateItemRequest(requestBody);
      if (!validationResult.isValid) {
        logger.warn('Invalid create item request', { errors: validationResult.errors });
        throw createValidationError(validationResult.errors);
      }

      logger.info('Creating item', { name: requestBody.name });

      // Generate new item
      const newItem: Item = {
        id: (itemsStore.length + 1).toString(), // Simple ID generation
        name: requestBody.name,
        description: requestBody.description,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add to store
      itemsStore.push(newItem);

      // Log the operation
      const duration = Date.now() - startTime;
      logger.logRequestEnd('POST', '/items', 201, duration);
      logger.info('Item created successfully', { itemId: newItem.id, itemName: newItem.name });

      // Return success response
      return createSuccessResponse<Item>(newItem, 'Item created successfully', 201);

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to create item', error as Error, { duration });
      return handleError(error);
    }
  }
);

/**
 * PUT /items/{id} - Update an existing item
 */
export const updateItem: LambdaHandler = withErrorHandling(
  async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const logger = createRequestLogger(event, context);
    const startTime = Date.now();

    try {
      // Handle CORS preflight
      if (isCorsPreflightRequest(event)) {
        return handleCorsPreflightRequest();
      }

      // Extract and validate path parameters
      const pathParams = getPathParameters<ItemPathParams>(event);
      assertExists(pathParams, 'Path parameters are required');

      const idValidationResult = validateItemId(pathParams.id);
      if (!idValidationResult.isValid) {
        logger.warn('Invalid item ID', { id: pathParams.id, errors: idValidationResult.errors });
        throw createValidationError(idValidationResult.errors);
      }

      // Extract and validate request body
      const requestBody = getJsonBody<UpdateItemRequest>(event);
      assertExists(requestBody, 'Request body is required');

      const bodyValidationResult = validateUpdateItemRequest(requestBody);
      if (!bodyValidationResult.isValid) {
        logger.warn('Invalid update item request', { errors: bodyValidationResult.errors });
        throw createValidationError(bodyValidationResult.errors);
      }

      const itemId = pathParams.id;
      logger.info('Updating item', { itemId, updates: requestBody });

      // Find the item
      const itemIndex = itemsStore.findIndex(item => item.id === itemId);
      if (itemIndex === -1) {
        logger.warn('Item not found for update', { itemId });
        throw new NotFoundError(`Item with ID ${itemId} not found`);
      }

      // Update the item
      const existingItem = itemsStore[itemIndex];
      const updatedItem: Item = {
        ...existingItem,
        ...(requestBody.name !== undefined && { name: requestBody.name }),
        ...(requestBody.description !== undefined && { description: requestBody.description }),
        ...(requestBody.status !== undefined && { status: requestBody.status }),
        updatedAt: new Date().toISOString(),
      };

      itemsStore[itemIndex] = updatedItem;

      // Log the operation
      const duration = Date.now() - startTime;
      logger.logRequestEnd('PUT', `/items/${itemId}`, 200, duration);
      logger.info('Item updated successfully', { itemId, itemName: updatedItem.name });

      // Return success response
      return createSuccessResponse<Item>(updatedItem, 'Item updated successfully');

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to update item', error as Error, { duration });
      return handleError(error);
    }
  }
);

/**
 * DELETE /items/{id} - Delete an item
 */
export const deleteItem: LambdaHandler = withErrorHandling(
  async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const logger = createRequestLogger(event, context);
    const startTime = Date.now();

    try {
      // Handle CORS preflight
      if (isCorsPreflightRequest(event)) {
        return handleCorsPreflightRequest();
      }

      // Extract and validate path parameters
      const pathParams = getPathParameters<ItemPathParams>(event);
      assertExists(pathParams, 'Path parameters are required');

      const validationResult = validateItemId(pathParams.id);
      if (!validationResult.isValid) {
        logger.warn('Invalid item ID', { id: pathParams.id, errors: validationResult.errors });
        throw createValidationError(validationResult.errors);
      }

      const itemId = pathParams.id;
      logger.info('Deleting item', { itemId });

      // Find the item
      const itemIndex = itemsStore.findIndex(item => item.id === itemId);
      if (itemIndex === -1) {
        logger.warn('Item not found for deletion', { itemId });
        throw new NotFoundError(`Item with ID ${itemId} not found`);
      }

      // Remove the item
      const deletedItem = itemsStore[itemIndex];
      itemsStore.splice(itemIndex, 1);

      // Log the operation
      const duration = Date.now() - startTime;
      logger.logRequestEnd('DELETE', `/items/${itemId}`, 200, duration);
      logger.info('Item deleted successfully', { itemId, itemName: deletedItem.name });

      // Return success response
      return createSuccessResponse<{ id: string }>(
        { id: itemId },
        'Item deleted successfully'
      );

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to delete item', error as Error, { duration });
      return handleError(error);
    }
  }
);