/**
 * Port for prompt persistence and retrieval.
 * Implemented by infrastructure layer.
 */

import type { Result } from '@praxos/common';
import type {
  Prompt,
  CreatePromptParams,
  UpdatePromptParams,
  ListPromptsParams,
  PromptList,
} from '../models/Prompt.js';
import type { PromptError } from '../models/PromptError.js';

/**
 * Repository interface for prompt storage operations.
 */
export interface PromptRepository {
  /**
   * Create a new prompt.
   */
  createPrompt(
    userId: string,
    params: CreatePromptParams
  ): Promise<Result<Prompt, PromptError>>;

  /**
   * Get a prompt by ID.
   */
  getPrompt(userId: string, promptId: string): Promise<Result<Prompt | null, PromptError>>;

  /**
   * List prompts for a user.
   */
  listPrompts(userId: string, params?: ListPromptsParams): Promise<Result<PromptList, PromptError>>;

  /**
   * Update a prompt.
   */
  updatePrompt(
    userId: string,
    promptId: string,
    params: UpdatePromptParams
  ): Promise<Result<Prompt, PromptError>>;

  /**
   * Delete a prompt.
   */
  deletePrompt(userId: string, promptId: string): Promise<Result<void, PromptError>>;
}
