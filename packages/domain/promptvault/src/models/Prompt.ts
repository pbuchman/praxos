/**
 * Prompt domain model.
 * Represents a prompt template in the system.
 */

/**
 * Complete prompt entity with all metadata.
 */
export interface Prompt {
  /**
   * Unique identifier for the prompt.
   */
  id: string;

  /**
   * Human-readable title.
   */
  title: string;

  /**
   * Full prompt content.
   */
  content: string;

  /**
   * Optional preview/excerpt of content.
   */
  preview?: string | undefined;

  /**
   * Optional tags for categorization.
   */
  tags?: string[] | undefined;

  /**
   * Source information about how the prompt was created.
   */
  source?: PromptSource | undefined;

  /**
   * ISO 8601 timestamp when the prompt was created.
   */
  createdAt: string;

  /**
   * ISO 8601 timestamp when the prompt was last updated.
   */
  updatedAt: string;

  /**
   * URL to view the prompt (if applicable).
   */
  url: string;
}

/**
 * Source information for a prompt.
 */
export interface PromptSource {
  /**
   * Type of source.
   */
  type: 'gpt' | 'manual' | 'import';

  /**
   * Additional details about the source.
   */
  details?: string | undefined;

  /**
   * User ID who created the prompt.
   */
  userId?: string | undefined;
}

/**
 * Parameters for creating a new prompt.
 */
export interface CreatePromptParams {
  /**
   * Prompt title (max 200 characters).
   */
  title: string;

  /**
   * Prompt content (max 100,000 characters).
   */
  prompt: string;

  /**
   * Optional tags.
   */
  tags?: string[] | undefined;

  /**
   * Optional source information.
   */
  source?: Omit<PromptSource, 'userId'> | undefined;
}

/**
 * Parameters for updating a prompt.
 */
export interface UpdatePromptParams {
  /**
   * New title (optional).
   */
  title?: string | undefined;

  /**
   * New content (optional).
   */
  prompt?: string | undefined;

  /**
   * New tags (optional).
   */
  tags?: string[] | undefined;

  /**
   * New source (optional).
   */
  source?: Omit<PromptSource, 'userId'> | undefined;
}

/**
 * Pagination parameters for listing prompts.
 */
export interface ListPromptsParams {
  /**
   * Maximum number of results (default 50, max 200).
   */
  limit?: number | undefined;

  /**
   * Cursor for pagination.
   */
  cursor?: string | undefined;

  /**
   * Whether to include full content (default false).
   */
  includeContent?: boolean | undefined;
}

/**
 * Paginated list of prompts.
 */
export interface PromptList {
  /**
   * List of prompts.
   */
  prompts: Prompt[];

  /**
   * Pagination cursor for next page (if available).
   */
  nextCursor?: string | undefined;

  /**
   * Whether there are more results.
   */
  hasMore: boolean;
}
