// API request and response type definitions

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

/**
 * Error response format
 */
export interface ErrorResponse {
    success: false;
    error: string;
    message: string;
    statusCode: number;
    timestamp: string;
}

/**
 * Item model interface
 */
export interface Item {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    status: 'active' | 'inactive';
}

/**
 * Request body for creating a new item
 */
export interface CreateItemRequest {
    name: string;
    description: string;
}

/**
 * Request body for updating an existing item
 */
export interface UpdateItemRequest {
    name?: string;
    description?: string;
    status?: 'active' | 'inactive';
}

/**
 * Response for item operations
 */
export interface ItemResponse extends ApiResponse<Item> { }

/**
 * Response for list operations
 */
export interface ItemListResponse extends ApiResponse<Item[]> { }

/**
 * Path parameters for item operations
 */
export interface ItemPathParams {
    id: string;
}

/**
 * Query parameters for listing items
 */
export interface ItemQueryParams {
    limit?: string;
    offset?: string;
    status?: 'active' | 'inactive';
}