/**
 * Notion implementation of PromptRepository.
 * Maps domain Prompt model to/from Notion pages and blocks.
 */

import { Client, isNotionClientError, APIErrorCode } from '@notionhq/client';
import type { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints.js';
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
  PromptErrorCode,
} from '@praxos/domain-promptvault';

/**
 * Map Notion API errors to domain errors.
 */
function mapNotionError(error: unknown): PromptError {
  if (isNotionClientError(error)) {
    let code: PromptErrorCode = 'INTERNAL_ERROR';

    switch (error.code) {
      case APIErrorCode.Unauthorized:
        code = 'UNAUTHORIZED';
        break;
      case APIErrorCode.ObjectNotFound:
        code = 'NOT_FOUND';
        break;
      case APIErrorCode.RateLimited:
        code = 'RATE_LIMITED';
        break;
      case APIErrorCode.ValidationError:
      case APIErrorCode.InvalidJSON:
        code = 'VALIDATION_ERROR';
        break;
      default:
        code = 'INTERNAL_ERROR';
    }

    return {
      code,
      message: error.message,
    };
  }

  const message = error instanceof Error ? error.message : 'Unknown Notion API error';
  return {
    code: 'INTERNAL_ERROR',
    message,
  };
}

/**
 * Extract title from Notion page properties.
 */
function extractPageTitle(page: { properties: Record<string, unknown> }): string {
  const titleProp =
    page.properties['title'] ??
    page.properties['Title'] ??
    page.properties['Name'] ??
    page.properties['name'];

  if (
    titleProp !== null &&
    typeof titleProp === 'object' &&
    'title' in titleProp &&
    Array.isArray((titleProp as { title: unknown[] }).title)
  ) {
    const titleArray = (titleProp as { title: { plain_text?: string }[] }).title;
    return titleArray.map((t) => t.plain_text ?? '').join('');
  }

  return 'Untitled';
}

/**
 * Extract timestamps from Notion page.
 */
function extractTimestamps(page: {
  created_time: string;
  last_edited_time: string;
}): { createdAt: string; updatedAt: string } {
  return {
    createdAt: page.created_time,
    updatedAt: page.last_edited_time,
  };
}

/**
 * Extract URL from Notion page.
 */
function extractUrl(page: { id: string; url?: string }): string {
  return page.url ?? `https://notion.so/${page.id.replace(/-/g, '')}`;
}

/**
 * Type guard for block objects.
 */
function isBlockWithType(block: unknown): block is BlockObjectResponse {
  return (
    typeof block === 'object' &&
    block !== null &&
    'type' in block &&
    typeof (block as { type: unknown }).type === 'string'
  );
}

/**
 * Extract prompt content and metadata from Notion blocks.
 * Expected structure:
 * 1. heading_2: "Prompt"
 * 2. code block: prompt content
 * 3. heading_2: "Meta" (optional)
 * 4. bulleted_list_item: Tags: ... (optional)
 * 5. bulleted_list_item: Source: ... (optional)
 * 6. bulleted_list_item: UserId: ... (optional)
 */
function parsePromptBlocks(blocks: BlockObjectResponse[]): {
  content: string;
  preview: string;
  tags?: string[];
  source?: PromptSource;
} {
  let content = '';
  let preview = '';
  let tags: string[] | undefined;
  let source: PromptSource | undefined;

  let inPromptSection = false;
  let inMetaSection = false;

  for (const block of blocks) {
    const blockType = block.type;
    const blockData = block[blockType as keyof typeof block] as
      | { rich_text?: { plain_text?: string }[] }
      | undefined;

    const textContent =
      blockData !== undefined && 'rich_text' in blockData && Array.isArray(blockData.rich_text)
        ? blockData.rich_text.map((t) => t.plain_text ?? '').join('')
        : '';

    if (blockType === 'heading_2' && textContent === 'Prompt') {
      inPromptSection = true;
      inMetaSection = false;
      continue;
    }

    if (blockType === 'heading_2' && textContent === 'Meta') {
      inPromptSection = false;
      inMetaSection = true;
      continue;
    }

    if (inPromptSection && blockType === 'code') {
      content = textContent;
      preview = textContent.substring(0, 200);
      inPromptSection = false;
      continue;
    }

    if (inMetaSection && blockType === 'bulleted_list_item') {
      if (textContent.startsWith('Tags: ')) {
        const tagsStr = textContent.substring(6).trim();
        tags = tagsStr.split(',').map((t) => t.trim()).filter((t) => t.length > 0);
      } else if (textContent.startsWith('Source: ')) {
        const sourceStr = textContent.substring(8).trim();
        const parts = sourceStr.split(' - ');
        const sourceType = parts[0].toLowerCase() as 'gpt' | 'manual' | 'import';
        source = {
          type: sourceType,
          details: parts[1],
        };
      } else if (textContent.startsWith('UserId: ')) {
        const userId = textContent.substring(8).trim();
        if (source !== undefined) {
          source.userId = userId;
        } else {
          source = { type: 'manual', userId };
        }
      }
    }
  }

  return {
    content,
    preview,
    tags: tags === undefined ? undefined : tags,
    source: source === undefined ? undefined : source,
  };
}

/**
 * Convert Notion page and blocks to domain Prompt.
 */
async function notionPageToPrompt(
  client: Client,
  pageId: string
): Promise<Result<Prompt, PromptError>> {
  try {
    const pageResponse = await client.pages.retrieve({ page_id: pageId });

    if (!('properties' in pageResponse)) {
      return err({
        code: 'INTERNAL_ERROR',
        message: 'Unexpected page response format',
      });
    }

    const page = pageResponse as {
      id: string;
      properties: Record<string, unknown>;
      created_time: string;
      last_edited_time: string;
      url?: string;
    };

    const title = extractPageTitle(page);
    const { createdAt, updatedAt } = extractTimestamps(page);
    const url = extractUrl(page);

    // Get blocks
    const blocksResponse = await client.blocks.children.list({
      block_id: pageId,
      page_size: 100,
    });

    const blocks = blocksResponse.results.filter(isBlockWithType);
    const { content, preview, tags, source } = parsePromptBlocks(blocks);

    const prompt: Prompt = {
      id: page.id,
      title,
      content,
      preview,
      tags,
      source,
      createdAt,
      updatedAt,
      url,
    };

    return ok(prompt);
  } catch (error) {
    return err(mapNotionError(error));
  }
}

/**
 * Create Notion blocks for a prompt.
 */
function createPromptBlocks(
  params: CreatePromptParams,
  userId: string
): Array<{
  object: 'block';
  type: string;
  [key: string]: unknown;
}> {
  const blocks: Array<{
    object: 'block';
    type: string;
    [key: string]: unknown;
  }> = [
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: 'Prompt' } }],
      },
    },
    {
      object: 'block',
      type: 'code',
      code: {
        rich_text: [{ type: 'text', text: { content: params.prompt } }],
        language: 'plain text',
      },
    },
    {
      object: 'block',
      type: 'divider',
      divider: {},
    },
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: 'Meta' } }],
      },
    },
  ];

  if (params.tags !== undefined && params.tags.length > 0) {
    blocks.push({
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [{ type: 'text', text: { content: `Tags: ${params.tags.join(', ')}` } }],
      },
    });
  }

  if (params.source !== undefined) {
    const sourceText = params.source.details
      ? `Source: ${params.source.type} - ${params.source.details}`
      : `Source: ${params.source.type}`;
    blocks.push({
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [{ type: 'text', text: { content: sourceText } }],
      },
    });
  }

  blocks.push({
    object: 'block',
    type: 'bulleted_list_item',
    bulleted_list_item: {
      rich_text: [{ type: 'text', text: { content: `UserId: ${userId}` } }],
    },
  });

  return blocks;
}

/**
 * Notion-based implementation of PromptRepository.
 */
export class NotionPromptRepository implements PromptRepository {
  constructor(
    private readonly getToken: (userId: string) => Promise<Result<string | null, PromptError>>,
    private readonly getPromptVaultPageId: (
      userId: string
    ) => Promise<Result<string | null, PromptError>>
  ) {}

  async createPrompt(
    userId: string,
    params: CreatePromptParams
  ): Promise<Result<Prompt, PromptError>> {
    const tokenResult = await this.getToken(userId);
    if (!tokenResult.ok) return err(tokenResult.error);
    const token = tokenResult.value;
    if (token === null) {
      return err({ code: 'MISCONFIGURED', message: 'Notion token not found' });
    }

    const pageIdResult = await this.getPromptVaultPageId(userId);
    if (!pageIdResult.ok) return err(pageIdResult.error);
    const parentPageId = pageIdResult.value;
    if (parentPageId === null) {
      return err({ code: 'MISCONFIGURED', message: 'PromptVault page not configured' });
    }

    try {
      const client = new Client({ auth: token });

      const response = await client.pages.create({
        parent: { page_id: parentPageId },
        properties: {
          title: {
            title: [{ text: { content: params.title } }],
          },
        },
        children: createPromptBlocks(params, userId),
      });

      return await notionPageToPrompt(client, response.id);
    } catch (error) {
      return err(mapNotionError(error));
    }
  }

  async getPrompt(userId: string, promptId: string): Promise<Result<Prompt | null, PromptError>> {
    const tokenResult = await this.getToken(userId);
    if (!tokenResult.ok) return err(tokenResult.error);
    const token = tokenResult.value;
    if (token === null) {
      return err({ code: 'MISCONFIGURED', message: 'Notion token not found' });
    }

    try {
      const client = new Client({ auth: token });
      return await notionPageToPrompt(client, promptId);
    } catch (error) {
      const mappedError = mapNotionError(error);
      if (mappedError.code === 'NOT_FOUND') {
        return ok(null);
      }
      return err(mappedError);
    }
  }

  async listPrompts(
    userId: string,
    params?: ListPromptsParams
  ): Promise<Result<PromptList, PromptError>> {
    const tokenResult = await this.getToken(userId);
    if (!tokenResult.ok) return err(tokenResult.error);
    const token = tokenResult.value;
    if (token === null) {
      return err({ code: 'MISCONFIGURED', message: 'Notion token not found' });
    }

    const pageIdResult = await this.getPromptVaultPageId(userId);
    if (!pageIdResult.ok) return err(pageIdResult.error);
    const parentPageId = pageIdResult.value;
    if (parentPageId === null) {
      return err({ code: 'MISCONFIGURED', message: 'PromptVault page not configured' });
    }

    try {
      const client = new Client({ auth: token });
      const limit = params?.limit ?? 50;
      const includeContent = params?.includeContent ?? false;

      const response = await client.blocks.children.list({
        block_id: parentPageId,
        page_size: Math.min(limit, 100),
        start_cursor: params?.cursor,
      });

      const prompts: Prompt[] = [];

      for (const item of response.results) {
        if (item.type === 'child_page' && 'id' in item) {
          const promptResult = await notionPageToPrompt(client, item.id);
          if (promptResult.ok) {
            const prompt = promptResult.value;
            if (!includeContent) {
              prompts.push({ ...prompt, content: '' });
            } else {
              prompts.push(prompt);
            }
          }
        }
      }

      return ok({
        prompts,
        nextCursor: response.next_cursor ?? undefined,
        hasMore: response.has_more,
      });
    } catch (error) {
      return err(mapNotionError(error));
    }
  }

  async updatePrompt(
    userId: string,
    promptId: string,
    params: UpdatePromptParams
  ): Promise<Result<Prompt, PromptError>> {
    const tokenResult = await this.getToken(userId);
    if (!tokenResult.ok) return err(tokenResult.error);
    const token = tokenResult.value;
    if (token === null) {
      return err({ code: 'MISCONFIGURED', message: 'Notion token not found' });
    }

    try {
      const client = new Client({ auth: token });

      // Update title if provided
      if (params.title !== undefined) {
        await client.pages.update({
          page_id: promptId,
          properties: {
            title: {
              title: [{ text: { content: params.title } }],
            },
          },
        });
      }

      // Update blocks if content or metadata changed
      if (
        params.prompt !== undefined ||
        params.tags !== undefined ||
        params.source !== undefined
      ) {
        // Get existing blocks
        const blocksResponse = await client.blocks.children.list({
          block_id: promptId,
          page_size: 100,
        });

        // Delete existing blocks
        for (const block of blocksResponse.results) {
          if ('id' in block) {
            await client.blocks.delete({ block_id: block.id });
          }
        }

        // Get current prompt to merge with updates
        const currentPromptResult = await this.getPrompt(userId, promptId);
        if (!currentPromptResult.ok) return err(currentPromptResult.error);
        const currentPrompt = currentPromptResult.value;
        if (currentPrompt === null) {
          return err({ code: 'NOT_FOUND', message: 'Prompt not found' });
        }

        // Create new blocks with merged data
        const mergedParams: CreatePromptParams = {
          title: params.title ?? currentPrompt.title,
          prompt: params.prompt ?? currentPrompt.content,
          tags: params.tags ?? currentPrompt.tags,
          source: params.source ?? currentPrompt.source,
        };

        const newBlocks = createPromptBlocks(mergedParams, userId);

        await client.blocks.children.append({
          block_id: promptId,
          children: newBlocks,
        });
      }

      return await notionPageToPrompt(client, promptId);
    } catch (error) {
      return err(mapNotionError(error));
    }
  }

  async deletePrompt(userId: string, promptId: string): Promise<Result<void, PromptError>> {
    const tokenResult = await this.getToken(userId);
    if (!tokenResult.ok) return err(tokenResult.error);
    const token = tokenResult.value;
    if (token === null) {
      return err({ code: 'MISCONFIGURED', message: 'Notion token not found' });
    }

    try {
      const client = new Client({ auth: token });
      await client.pages.update({
        page_id: promptId,
        archived: true,
      });
      return ok(undefined);
    } catch (error) {
      return err(mapNotionError(error));
    }
  }
}
