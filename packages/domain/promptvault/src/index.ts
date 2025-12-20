/**
 * @praxos/domain-promptvault
 *
 * Prompt vault domain - prompt template management and versioning.
 *
 * Structure:
 * - models/    Domain entities
 * - ports/     Interfaces for external dependencies
 * - usecases/  Application services (future)
 * - policies/  Validation and business rules (future)
 */

// Models - domain entities
export type {
  Prompt,
  PromptSource,
  CreatePromptParams,
  UpdatePromptParams,
  ListPromptsParams,
  PromptList,
} from './models/Prompt.js';
export type { PromptError, PromptErrorCode } from './models/PromptError.js';

// Ports - interfaces for external dependencies
export type { PromptRepository } from './ports/PromptRepository.js';

// Legacy Notion-specific ports (for backwards compatibility)
// These will be deprecated once the refactoring is complete
export type {
  NotionConnectionConfig,
  NotionConnectionPublic,
  NotionPage,
  NotionBlock,
  CreatedNote,
  NotionErrorCode,
  NotionError,
  NotionConnectionRepository,
  NotionApiPort,
  IdempotencyLedger,
  CreatePromptVaultNoteParams,
} from './ports.js';
export {
  NOTION_ERROR_CODES,
  isNotionErrorCode,
  type NotionErrorCodeRuntime,
} from './notionErrorCode.js';
