/**
 * Service container for notion-gpt-service.
 * Provides dependency injection for adapters.
 */
import type {
  NotionConnectionRepository,
  NotionApiPort,
  PromptRepository,
} from '@praxos/domain-promptvault';
import {
  CreatePromptUseCase,
  ListPromptsUseCase,
  GetPromptUseCase,
  UpdatePromptUseCase,
} from '@praxos/domain-promptvault';
import { FirestoreNotionConnectionRepository } from '@praxos/infra-firestore';
import { NotionApiAdapter, NotionPromptRepository } from '@praxos/infra-notion';

/**
 * Service container holding all adapter instances and use cases.
 */
export interface ServiceContainer {
  connectionRepository: NotionConnectionRepository;
  notionApi: NotionApiPort;
  promptRepository: PromptRepository;
  createPromptUseCase: CreatePromptUseCase;
  listPromptsUseCase: ListPromptsUseCase;
  getPromptUseCase: GetPromptUseCase;
  updatePromptUseCase: UpdatePromptUseCase;
}

let container: ServiceContainer | null = null;

/**
 * Get or create the service container.
 * In production, uses real Firestore and Notion adapters.
 */
export function getServices(): ServiceContainer {
  if (container === null) {
    const connectionRepository = new FirestoreNotionConnectionRepository();
    const notionApi = new NotionApiAdapter();
    const promptRepository = new NotionPromptRepository(connectionRepository);

    container = {
      connectionRepository,
      notionApi,
      promptRepository,
      createPromptUseCase: new CreatePromptUseCase(promptRepository),
      listPromptsUseCase: new ListPromptsUseCase(promptRepository),
      getPromptUseCase: new GetPromptUseCase(promptRepository),
      updatePromptUseCase: new UpdatePromptUseCase(promptRepository),
    };
  }
  return container;
}

/**
 * Set a custom service container (for testing).
 */
export function setServices(services: ServiceContainer): void {
  container = services;
}

/**
 * Reset the service container (for testing).
 */
export function resetServices(): void {
  container = null;
}
