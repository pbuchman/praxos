/**
 * PromptRepository port.
 * 
 * Domain interface for prompt persistence operations.
 * Infrastructure adapters (e.g., Notion) implement this port.
 */

import type { Result } from '@praxos/common';
import type {
  Prompt,
  PromptCreate,
  PromptUpdate,
  PromptListOptions,
  PromptListResult,
} from '../models/Prompt.js';
import type { NotionError } from '../ports.js';

export interface PromptRepository {
  /**
   * Create a new prompt.
   * 
   * @param userId - User ID (for multi-tenant storage)
   * @param data - Prompt creation data
   * @returns Created prompt with generated ID and metadata
   */
  createPrompt(userId: string, data: PromptCreate): Promise<Result<Prompt, NotionError>>;

  /**
   * List prompts for a user.
   * 
   * @param userId - User ID
   * @param options - Pagination and filtering options
   * @returns List of prompts (summary or full, based on includeContent)
   */
  listPrompts(
    userId: string,
    options?: PromptListOptions
  ): Promise<Result<PromptListResult, NotionError>>;

  /**
   * Get a single prompt by ID.
   * 
   * @param userId - User ID
   * @param promptId - Prompt ID
   * @returns Full prompt with content
   */
  getPrompt(userId: string, promptId: string): Promise<Result<Prompt, NotionError>>;

  /**
   * Update a prompt (partial update).
   * 
   * @param userId - User ID
   * @param promptId - Prompt ID
   * @param data - Fields to update
   * @returns Updated prompt
   */
  updatePrompt(
    userId: string,
    promptId: string,
    data: PromptUpdate
  ): Promise<Result<Prompt, NotionError>>;
}
