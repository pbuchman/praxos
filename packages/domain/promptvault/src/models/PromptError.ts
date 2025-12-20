/**
 * Domain error types for prompt operations.
 */

/**
 * Error codes for prompt operations.
 */
export type PromptErrorCode =
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'RATE_LIMITED'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR'
  | 'MISCONFIGURED';

/**
 * Error object for prompt operations.
 */
export interface PromptError {
  code: PromptErrorCode;
  message: string;
  requestId?: string | undefined;
}
