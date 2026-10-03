// Re-export common types from @sudobility/types
export type {
  ApiResponse,
  BaseResponse,
  NetworkClient,
  Optional,
} from '@sudobility/types';
import type { BaseResponse } from '@sudobility/types';

// =============================================================================
// Type Aliases
// =============================================================================

/**
 * ISO 8601 formatted datetime string.
 *
 * @example "2025-01-15T10:30:00.000Z"
 */
export type ISODateString = string & { readonly __brand: 'ISODateString' };

// =============================================================================
// User
// =============================================================================

/**
 * User account information.
 *
 * @example
 * ```typescript
 * const user: User = {
 *   firebase_uid: 'uid123',
 *   email: 'user@example.com',
 *   display_name: 'John Doe',
 *   created_at: '2025-01-15T10:30:00.000Z',
 *   updated_at: '2025-01-15T10:30:00.000Z',
 * };
 * ```
 */
export interface User {
  /** Firebase Authentication UID */
  firebase_uid: string;
  /** User email address, nullable */
  email: string | null;
  /** User display name, nullable */
  display_name: string | null;
  /** ISO 8601 timestamp of account creation, nullable */
  created_at: string | null;
  /** ISO 8601 timestamp of last update, nullable */
  updated_at: string | null;
}

// =============================================================================
// API Responses
// =============================================================================

/**
 * Response for the root API metadata endpoint (`GET /`).
 *
 * @example
 * ```typescript
 * const info: ApiInfoResponse = {
 *   name: 'RaidrAgent API',
 *   version: '1.0.0',
 *   status: 'healthy',
 * };
 * ```
 */
export interface ApiInfoResponse {
  /** The name of the API */
  name: string;
  /** The API version string */
  version: string;
  /** Current operational status */
  status: string;
}

/**
 * Response for the health check endpoint (`GET /health`).
 *
 * @example
 * ```typescript
 * const health: HealthResponse = {
 *   status: 'ok',
 *   version: '1.0.0',
 * };
 * ```
 */
export interface HealthResponse {
  /** Current health status */
  status: string;
  /** The API version string */
  version: string;
}

/**
 * Placeholder payload for a health check, used by the client's `getHealth`.
 *
 * Identical in shape to {@link HealthResponse}; kept as a separate name so
 * the client/lib layers have one trivial export to build and test against.
 */
export type HealthCheckData = HealthResponse;

// =============================================================================
// Response Helpers
// =============================================================================

/**
 * Constructs a successful API response.
 *
 * Creates a {@link BaseResponse} with `success: true`, the provided data payload,
 * and a timestamp set to the current time in ISO 8601 format.
 *
 * @typeParam T - The type of the response payload
 * @param data - The response payload (can be any type, including `undefined` or `null`)
 * @returns A {@link BaseResponse} with `success: true` and `data` property set
 *
 * @example
 * ```typescript
 * // Successful single record
 * const response1 = successResponse({ id: '123', name: 'test' });
 *
 * // Array of records
 * const response2 = successResponse([
 *   { id: '1', value: 100 },
 *   { id: '2', value: 200 },
 * ]);
 *
 * // Null or undefined data (valid, though potentially unusual)
 * const response3 = successResponse(null);
 * ```
 *
 * @internal
 * Timestamp is always included in the response envelope and formatted as ISO 8601.
 */
export function successResponse<T>(data: T): BaseResponse<T> {
  return { success: true, data, timestamp: new Date().toISOString() };
}

/**
 * Constructs an error API response.
 *
 * Creates a {@link BaseResponse} with `success: false`, the provided error message,
 * and a timestamp set to the current time in ISO 8601 format.
 *
 * **Note:** This function accepts empty strings as valid error messages. While this
 * is allowed by the runtime and type system, it is generally recommended to provide
 * meaningful, non-empty error descriptions for better debugging and client-side handling.
 *
 * @param error - A descriptive error message (may be empty, though not recommended)
 * @returns A {@link BaseResponse} with `success: false` and `error` property set
 *
 * @example
 * ```typescript
 * // Standard error
 * const response1 = errorResponse('User not found');
 *
 * // Error with context
 * const response2 = errorResponse('Invalid datetime format: expected ISO 8601');
 *
 * // Empty string (allowed but not recommended)
 * const response3 = errorResponse('');
 * ```
 *
 * @internal
 * Timestamp is always included in the response envelope and formatted as ISO 8601.
 */
export function errorResponse(error: string): BaseResponse<never> {
  return { success: false, error, timestamp: new Date().toISOString() };
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Type guard to narrow a {@link BaseResponse} to a successful response.
 *
 * Checks if a response has `success: true`, allowing TypeScript to narrow
 * the type to access the `data` property safely.
 *
 * @typeParam T - The expected type of the response data
 * @param response - The response to check
 * @returns `true` if the response is successful, `false` otherwise
 *
 * @example
 * ```typescript
 * const response = await client.getHealth();
 * if (isSuccessResponse(response)) {
 *   // TypeScript now knows response.data is HealthCheckData
 *   console.log(response.data.status);
 * }
 * ```
 */
export function isSuccessResponse<T>(
  response: BaseResponse<T>
): response is BaseResponse<T> & { success: true; data: T } {
  return response.success === true;
}

/**
 * Type guard to narrow a {@link BaseResponse} to an error response.
 *
 * Checks if a response has `success: false`, allowing TypeScript to narrow
 * the type to access the `error` property safely.
 *
 * @param response - The response to check
 * @returns `true` if the response is an error, `false` otherwise
 *
 * @example
 * ```typescript
 * const response = await client.getHealth();
 * if (isErrorResponse(response)) {
 *   // TypeScript now knows response.error is string
 *   throw new Error(response.error);
 * }
 * ```
 */
export function isErrorResponse(
  response: BaseResponse<unknown>
): response is BaseResponse<never> & { success: false; error: string } {
  return response.success === false;
}
export * from './agent.js';
