/**
 * CreatePromptUseCase
 * 
 * Creates a new prompt with validation.
 */

import type { Result } from '@praxos/common';
import { err } from '@praxos/common';
import type { Prompt, PromptCreate } from '../models/Prompt.js';
import type { PromptRepository } from '../ports/PromptRepository.js';
import type { NotionError } from '../ports.js';

export class CreatePromptUseCase {
  constructor(private readonly repository: PromptRepository) {}

  async execute(userId: string, data: PromptCreate): Promise<Result<Prompt, NotionError>> {
    // Validate title
    if (data.title.trim().length === 0) {
      return err({
        code: 'VALIDATION_ERROR',
        message: 'Title cannot be empty',
      });
    }

    if (data.title.length > 200) {
      return err({
        code: 'VALIDATION_ERROR',
        message: 'Title must be at most 200 characters',
      });
    }

    // Validate prompt
    if (data.prompt.trim().length === 0) {
      return err({
        code: 'VALIDATION_ERROR',
        message: 'Prompt content cannot be empty',
      });
    }

    if (data.prompt.length > 100000) {
      return err({
        code: 'VALIDATION_ERROR',
        message: 'Prompt content must be at most 100,000 characters',
      });
    }

    // Validate tags (if provided)
    if (data.tags !== undefined) {
      if (data.tags.length > 20) {
        return err({
          code: 'VALIDATION_ERROR',
          message: 'Maximum 20 tags allowed',
        });
      }

      for (const tag of data.tags) {
        if (tag.trim().length === 0) {
          return err({
            code: 'VALIDATION_ERROR',
            message: 'Tags cannot be empty strings',
          });
        }

        if (tag.length > 50) {
          return err({
            code: 'VALIDATION_ERROR',
            message: 'Each tag must be at most 50 characters',
          });
        }
      }
    }

    // Delegate to repository
    return await this.repository.createPrompt(userId, data);
  }
}
