import { z } from 'zod';

/**
 * POST /v1/integrations/notion/connect
 */
export const connectRequestSchema = z.object({
  notionToken: z.string().min(1, 'notionToken is required'),
  promptVaultPageId: z.string().min(1, 'promptVaultPageId is required'),
});

export type ConnectRequest = z.infer<typeof connectRequestSchema>;

/**
 * POST /v1/tools/notion/promptvault/prompts (create prompt)
 *
 * Schema constraints:
 * - title: max 200 characters (Notion page title practical limit)
 * - prompt: max 100,000 characters (Notion code block can handle large content)
 * - tags: optional array of strings, max 20 tags, each max 50 characters
 * - source: optional object with type and optional details
 */
export const createPromptRequestSchema = z
  .object({
    title: z.string().min(1, 'title is required').max(200, 'title must be at most 200 characters'),
    prompt: z
      .string()
      .min(1, 'prompt is required')
      .max(100000, 'prompt must be at most 100,000 characters'),
    tags: z.array(z.string().max(50, 'each tag must be at most 50 characters')).max(20, 'maximum 20 tags allowed').optional(),
    source: z.object({
      type: z.enum(['gpt', 'manual', 'import']),
      details: z.string().optional(),
    }).optional(),
  })
  .strict();

export type CreatePromptRequest = z.infer<typeof createPromptRequestSchema>;

/**
 * GET /v1/tools/notion/promptvault/prompts (list prompts)
 */
export const listPromptsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  cursor: z.string().optional(),
  includeContent: z.coerce.boolean().optional(),
});

export type ListPromptsQuery = z.infer<typeof listPromptsQuerySchema>;

/**
 * PATCH /v1/tools/notion/promptvault/prompts/:promptId (update prompt)
 */
export const updatePromptRequestSchema = z
  .object({
    title: z.string().min(1, 'title cannot be empty').max(200, 'title must be at most 200 characters').optional(),
    prompt: z.string().min(1, 'prompt cannot be empty').max(100000, 'prompt must be at most 100,000 characters').optional(),
    tags: z.array(z.string().max(50, 'each tag must be at most 50 characters')).max(20, 'maximum 20 tags allowed').optional(),
    source: z.object({
      type: z.enum(['gpt', 'manual', 'import']),
      details: z.string().optional(),
    }).optional(),
  })
  .strict();

export type UpdatePromptRequest = z.infer<typeof updatePromptRequestSchema>;

/**
 * POST /v1/webhooks/notion
 */
export const webhookRequestSchema = z.record(z.unknown());

export type WebhookRequest = z.infer<typeof webhookRequestSchema>;
