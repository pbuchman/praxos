/**
 * Prompt domain entity.
 * 
 * Represents a prompt template in the PromptVault system.
 * This is the core domain model - no infrastructure concerns.
 */

export interface PromptSource {
  readonly type: 'gpt' | 'manual' | 'import';
  readonly details: string | undefined;
}

export interface Prompt {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly preview: string;
  readonly tags: readonly string[] | undefined;
  readonly source: PromptSource | undefined;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly url: string;
}

/**
 * Partial prompt data for creation (before persistence).
 */
export interface PromptCreate {
  readonly title: string;
  readonly prompt: string;
  readonly tags: readonly string[] | undefined;
  readonly source: PromptSource | undefined;
}

/**
 * Partial prompt data for updates.
 */
export interface PromptUpdate {
  readonly title: string | undefined;
  readonly prompt: string | undefined;
  readonly tags: readonly string[] | undefined;
  readonly source: PromptSource | undefined;
}

/**
 * Prompt without full content (for list views).
 */
export interface PromptSummary {
  readonly id: string;
  readonly title: string;
  readonly preview: string;
  readonly tags: readonly string[] | undefined;
  readonly source: PromptSource | undefined;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly url: string;
}

/**
 * Pagination support for list operations.
 */
export interface PromptListOptions {
  readonly limit: number | undefined;
  readonly cursor: string | undefined;
  readonly includeContent: boolean | undefined;
}

export interface PromptListResult {
  readonly prompts: readonly (Prompt | PromptSummary)[];
  readonly hasMore: boolean;
  readonly nextCursor: string | undefined;
}
