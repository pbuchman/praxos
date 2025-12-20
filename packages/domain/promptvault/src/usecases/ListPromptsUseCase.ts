/**
 * ListPromptsUseCase
 * 
 * Lists prompts with pagination.
 */

import type { Result } from '@praxos/common';
import { err } from '@praxos/common';
import type { PromptListOptions, PromptListResult } from '../models/Prompt.js';
import type { PromptRepository } from '../ports/PromptRepository.js';
import type { NotionError } from '../ports.js';

export class ListPromptsUseCase {
  constructor(private readonly repository: PromptRepository) {}

  async execute(
    userId: string,
    options?: PromptListOptions
  ): Promise<Result<PromptListResult, NotionError>> {
    // Validate limit
    const limit = options?.limit ?? 50;
    if (limit < 1 || limit > 200) {
      return err({
        code: 'VALIDATION_ERROR',
        message: 'Limit must be between 1 and 200',
      });
    }

    // Delegate to repository
    return await this.repository.listPrompts(userId, {
      ...options,
      limit,
    });
  }
}
