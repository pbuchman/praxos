/**
 * Mock PromptRepository for testing.
 */

import { ok, err, type Result } from '@praxos/common';
import type {
  PromptRepository,
  Prompt,
  PromptSource,
  CreatePromptParams,
  UpdatePromptParams,
  ListPromptsParams,
  PromptList,
  PromptError,
} from '@praxos/domain-promptvault';
import { randomUUID } from 'node:crypto';

/**
 * Mock PromptRepository implementation for testing.
 * Stores prompts in memory and provides inspection methods.
 */
export class MockPromptRepository implements PromptRepository {
  private prompts: Map<string, Prompt> = new Map();
  private lastCreated: Prompt | null = null;

  async createPrompt(
    _userId: string,
    params: CreatePromptParams
  ): Promise<Result<Prompt, PromptError>> {
    const id = randomUUID();
    const now = new Date().toISOString();

    const prompt: Prompt = {
      id,
      title: params.title,
      content: params.prompt,
      preview: params.prompt.substring(0, 200),
      tags: params.tags,
      source: params.source as PromptSource | undefined,
      createdAt: now,
      updatedAt: now,
      url: `https://notion.so/${id.replace(/-/g, '')}`,
    };

    this.prompts.set(id, prompt);
    this.lastCreated = prompt;

    return ok(prompt);
  }

  async getPrompt(_userId: string, promptId: string): Promise<Result<Prompt | null, PromptError>> {
    const prompt = this.prompts.get(promptId);
    return ok(prompt ?? null);
  }

  async listPrompts(
    _userId: string,
    params?: ListPromptsParams
  ): Promise<Result<PromptList, PromptError>> {
    const includeContent = params?.includeContent ?? false;
    const limit = params?.limit ?? 50;

    const allPrompts = Array.from(this.prompts.values());
    const prompts = allPrompts.slice(0, limit).map((p) =>
      includeContent
        ? p
        : {
            ...p,
            content: '',
          }
    );

    return ok({
      prompts,
      hasMore: allPrompts.length > limit,
      nextCursor: allPrompts.length > limit ? 'mock-cursor' : undefined,
    });
  }

  async updatePrompt(
    _userId: string,
    promptId: string,
    params: UpdatePromptParams
  ): Promise<Result<Prompt, PromptError>> {
    const existing = this.prompts.get(promptId);
    if (existing === undefined) {
      return err({ code: 'NOT_FOUND', message: 'Prompt not found' });
    }

    const updated: Prompt = {
      ...existing,
      title: params.title ?? existing.title,
      content: params.prompt ?? existing.content,
      tags: params.tags ?? existing.tags,
      source: (params.source as PromptSource | undefined) ?? existing.source,
      updatedAt: new Date().toISOString(),
    };

    this.prompts.set(promptId, updated);

    return ok(updated);
  }

  async deletePrompt(_userId: string, promptId: string): Promise<Result<void, PromptError>> {
    this.prompts.delete(promptId);
    return ok(undefined);
  }

  /**
   * Get the last created prompt (for test assertions).
   */
  getLastCreated(): Prompt | null {
    return this.lastCreated;
  }

  /**
   * Clear all stored prompts (for test cleanup).
   */
  clear(): void {
    this.prompts.clear();
    this.lastCreated = null;
  }
}
