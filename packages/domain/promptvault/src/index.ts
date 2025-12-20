/**
 * @praxos/domain-promptvault
 *
 * Prompt vault domain - prompt template management and versioning.
 *
 * Structure:
 * - ports/     Interfaces for external dependencies
 * - models/    Domain entities
 * - usecases/  Application services
 * - policies/  Validation and business rules (future)
 */

// Models - domain entities
export type {
  Prompt,
  PromptSource,
  PromptCreate,
  PromptUpdate,
  PromptSummary,
  PromptListOptions,
  PromptListResult,
} from './models/Prompt.js';

// Ports - interfaces for external dependencies
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

// Prompt Repository port
export type { PromptRepository } from './ports/PromptRepository.js';

// Use cases
export { CreatePromptUseCase } from './usecases/CreatePromptUseCase.js';
export { ListPromptsUseCase } from './usecases/ListPromptsUseCase.js';
export { GetPromptUseCase } from './usecases/GetPromptUseCase.js';
export { UpdatePromptUseCase } from './usecases/UpdatePromptUseCase.js';
