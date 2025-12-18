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
 * POST /v1/tools/notion/note
 */
export const createNoteRequestSchema = z.object({
  title: z.string().min(1, 'title is required'),
  content: z.string().min(1, 'content is required'),
  idempotencyKey: z.string().min(1, 'idempotencyKey is required'),
});

export type CreateNoteRequest = z.infer<typeof createNoteRequestSchema>;

/**
 * POST /v1/webhooks/notion
 */
export const webhookRequestSchema = z.record(z.unknown());

export type WebhookRequest = z.infer<typeof webhookRequestSchema>;
