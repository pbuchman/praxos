/**
 * GetPromptUseCase
 * 
 * Retrieves a single prompt by ID.
 */

import type { Result } from '@praxos/common';
import type { Prompt } from '../models/Prompt.js';
import type { PromptRepository } from '../ports/PromptRepository.js';
import type { NotionError } from '../ports.js';

export class GetPromptUseCase {
  constructor(private readonly repository: PromptRepository) {}

  async execute(userId: string, promptId: string): Promise<Result<Prompt, NotionError>> {
    return await this.repository.getPrompt(userId, promptId);
  }
}
