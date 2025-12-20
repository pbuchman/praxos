/**
 * Service container for notion-gpt-service.
 * Provides dependency injection for adapters.
 */
import type {
  NotionConnectionRepository,
  NotionApiPort,
  PromptRepository,
} from '@praxos/domain-promptvault';
import { FirestoreNotionConnectionRepository } from '@praxos/infra-firestore';
import { NotionApiAdapter, NotionPromptRepository } from '@praxos/infra-notion';

/**
 * Service container holding all adapter instances.
 */
export interface ServiceContainer {
  connectionRepository: NotionConnectionRepository;
  notionApi: NotionApiPort;
  promptRepository: PromptRepository;
}

let container: ServiceContainer | null = null;

/**
 * Get or create the service container.
 * In production, uses real Firestore and Notion adapters.
 */
export function getServices(): ServiceContainer {
  if (container === null) {
    const connectionRepository = new FirestoreNotionConnectionRepository();

    // Create PromptRepository with access to connection data
    const promptRepository = new NotionPromptRepository(
      async (userId) => {
        return await connectionRepository.getToken(userId);
      },
      async (userId) => {
        const result = await connectionRepository.getConnection(userId);
        if (!result.ok) return result;
        const config = result.value;
        if (config === null) return { ok: true, value: null };
        return { ok: true, value: config.promptVaultPageId };
      }
    );

    container = {
      connectionRepository,
      notionApi: new NotionApiAdapter(),
      promptRepository,
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
