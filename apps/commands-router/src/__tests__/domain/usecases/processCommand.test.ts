import { describe, it, expect, beforeEach } from 'vitest';
import { LlmModels } from '@intexuraos/llm-contract';
import { createProcessCommandUseCase } from '../../../domain/usecases/processCommand.js';
import type { Command } from '../../../domain/models/command.js';
import type { ClassificationResult } from '../../../domain/ports/classifier.js';
import {
  FakeCommandRepository,
  FakeActionsAgentClient,
  FakeClassifier,
  FakeUserServiceClient,
  FakeEventPublisher,
} from '../../fakes.js';
import pino from 'pino';

describe('processCommand usecase', () => {
  let commandRepository: FakeCommandRepository;
  let actionsAgentClient: FakeActionsAgentClient;
  let classifier: FakeClassifier;
  let userServiceClient: FakeUserServiceClient;
  let eventPublisher: FakeEventPublisher;
  const logger = pino({ name: 'test', level: 'silent' });

  const createValidInput = (overrides = {}): {
    userId: string;
    sourceType: 'whatsapp_text';
    externalId: string;
    text: string;
    timestamp: string;
  } => ({
    userId: 'user-123',
    sourceType: 'whatsapp_text' as const,
    externalId: 'msg-123',
    text: 'Research AI trends',
    timestamp: '2025-01-01T12:00:00.000Z',
    ...overrides,
  });

  beforeEach(() => {
    commandRepository = new FakeCommandRepository();
    actionsAgentClient = new FakeActionsAgentClient();
    classifier = new FakeClassifier();
    userServiceClient = new FakeUserServiceClient();
    eventPublisher = new FakeEventPublisher();
  });

  describe('Branch 1: Idempotency - existing command found', () => {
    it('returns existing command without reprocessing when command already exists', async () => {
      const existingCommand: Command = {
        id: 'whatsapp_text:msg-123',
        userId: 'user-123',
        sourceType: 'whatsapp_text',
        externalId: 'msg-123',
        text: 'Research AI trends',
        timestamp: '2025-01-01T12:00:00.000Z',
        status: 'classified',
        classification: {
          type: 'research',
          confidence: 0.9,
          reasoning: 'Test reasoning',
          classifiedAt: '2025-01-01T12:00:01.000Z',
        },
        actionId: 'action-1',
        createdAt: '2025-01-01T12:00:00.000Z',
        updatedAt: '2025-01-01T12:00:01.000Z',
      };

      commandRepository.addCommand(existingCommand);

      const usecase = createProcessCommandUseCase({
        commandRepository,
        actionsAgentClient,
        classifierFactory: () => classifier,
        userServiceClient,
        eventPublisher,
        logger,
      });

      const result = await usecase.execute(createValidInput());

      expect(result.isNew).toBe(false);
      expect(result.command).toBe(existingCommand);
      // Verify no new commands were created
      const allCommands = await commandRepository.listByUserId('user-123');
      expect(allCommands).toHaveLength(1);
    });
  });

  describe('Branch 2: API keys fetch failure', () => {
    it('marks command as pending_classification when API keys fetch fails', async () => {
      userServiceClient.setFailNext(true);

      const usecase = createProcessCommandUseCase({
        commandRepository,
        actionsAgentClient,
        classifierFactory: () => classifier,
        userServiceClient,
        eventPublisher,
        logger,
      });

      const result = await usecase.execute(createValidInput());

      expect(result.isNew).toBe(true);
      expect(result.command.status).toBe('pending_classification');
      expect(result.command.classification).toBeUndefined();
      expect(result.command.actionId).toBeUndefined();
    });
  });

  describe('Branch 3: No Google API key', () => {
    it('marks command as pending_classification when user has no Google API key', async () => {
      userServiceClient.setApiKeys('user-123', {}); // No Google key

      const usecase = createProcessCommandUseCase({
        commandRepository,
        actionsAgentClient,
        classifierFactory: () => classifier,
        userServiceClient,
        eventPublisher,
        logger,
      });

      const result = await usecase.execute(createValidInput());

      expect(result.isNew).toBe(true);
      expect(result.command.status).toBe('pending_classification');
      expect(result.command.classification).toBeUndefined();
      expect(result.command.actionId).toBeUndefined();
    });

    it('marks command as pending_classification when Google key is undefined', async () => {
      userServiceClient.setApiKeys('user-123', { google: undefined });

      const usecase = createProcessCommandUseCase({
        commandRepository,
        actionsAgentClient,
        classifierFactory: () => classifier,
        userServiceClient,
        eventPublisher,
        logger,
      });

      const result = await usecase.execute(createValidInput());

      expect(result.isNew).toBe(true);
      expect(result.command.status).toBe('pending_classification');
    });
  });

  describe('Branch 4: Action creation failure', () => {
    it('marks command as failed when action creation fails', async () => {
      userServiceClient.setApiKeys('user-123', { google: 'test-api-key' });
      classifier.setResult({
        type: 'research',
        confidence: 0.9,
        title: 'Research AI trends',
        reasoning: 'Test reasoning',
      });
      actionsAgentClient.setFailNext(true);

      const usecase = createProcessCommandUseCase({
        commandRepository,
        actionsAgentClient,
        classifierFactory: () => classifier,
        userServiceClient,
        eventPublisher,
        logger,
      });

      const result = await usecase.execute(createValidInput());

      expect(result.isNew).toBe(true);
      expect(result.command.status).toBe('failed');
      expect(result.command.failureReason).toBe('Actions-agent client error');
      expect(result.command.classification).toBeUndefined();
      expect(result.command.actionId).toBeUndefined();
    });
  });

  describe('Branch 5: Selected models in event payload', () => {
    it('includes selectedModels in event payload when present in classification', async () => {
      userServiceClient.setApiKeys('user-123', { google: 'test-api-key' });
      const classificationWithModels: ClassificationResult = {
        type: 'research',
        confidence: 0.9,
        title: 'Research AI trends',
        reasoning: 'Test reasoning',
        selectedModels: [LlmModels.GPT_4O, LlmModels.GEMINI_2_0_FLASH_THINKING_EXP_1219],
      };
      classifier.setResult(classificationWithModels);

      const usecase = createProcessCommandUseCase({
        commandRepository,
        actionsAgentClient,
        classifierFactory: () => classifier,
        userServiceClient,
        eventPublisher,
        logger,
      });

      const result = await usecase.execute(createValidInput());

      expect(result.isNew).toBe(true);
      expect(result.command.status).toBe('classified');

      const publishedEvents = eventPublisher.getPublishedEvents();
      expect(publishedEvents).toHaveLength(1);
      expect(publishedEvents[0]?.payload.selectedModels).toEqual([
        LlmModels.GPT_4O,
        LlmModels.GEMINI_2_0_FLASH_THINKING_EXP_1219,
      ]);
    });

    it('does not include selectedModels in event payload when not present in classification', async () => {
      userServiceClient.setApiKeys('user-123', { google: 'test-api-key' });
      const classificationWithoutModels: ClassificationResult = {
        type: 'research',
        confidence: 0.9,
        title: 'Research AI trends',
        reasoning: 'Test reasoning',
        // selectedModels is undefined
      };
      classifier.setResult(classificationWithoutModels);

      const usecase = createProcessCommandUseCase({
        commandRepository,
        actionsAgentClient,
        classifierFactory: () => classifier,
        userServiceClient,
        eventPublisher,
        logger,
      });

      const result = await usecase.execute(createValidInput());

      expect(result.isNew).toBe(true);
      expect(result.command.status).toBe('classified');

      const publishedEvents = eventPublisher.getPublishedEvents();
      expect(publishedEvents).toHaveLength(1);
      expect(publishedEvents[0]?.payload.selectedModels).toBeUndefined();
    });
  });

  describe('Branch 6: Event publishing failure and success paths', () => {
    it('continues processing when event publishing fails', async () => {
      userServiceClient.setApiKeys('user-123', { google: 'test-api-key' });
      classifier.setResult({
        type: 'research',
        confidence: 0.9,
        title: 'Research AI trends',
        reasoning: 'Test reasoning',
      });
      eventPublisher.setFailNext(true);

      const usecase = createProcessCommandUseCase({
        commandRepository,
        actionsAgentClient,
        classifierFactory: () => classifier,
        userServiceClient,
        eventPublisher,
        logger,
      });

      const result = await usecase.execute(createValidInput());

      // Processing continues despite publish failure
      expect(result.isNew).toBe(true);
      expect(result.command.status).toBe('classified');
      expect(result.command.classification).toBeDefined();
      expect(result.command.actionId).toBeDefined();

      const publishedEvents = eventPublisher.getPublishedEvents();
      expect(publishedEvents).toHaveLength(0); // Event was not published
    });

    it('logs success when event publishing succeeds', async () => {
      userServiceClient.setApiKeys('user-123', { google: 'test-api-key' });
      classifier.setResult({
        type: 'research',
        confidence: 0.9,
        title: 'Research AI trends',
        reasoning: 'Test reasoning',
      });

      const usecase = createProcessCommandUseCase({
        commandRepository,
        actionsAgentClient,
        classifierFactory: () => classifier,
        userServiceClient,
        eventPublisher,
        logger,
      });

      const result = await usecase.execute(createValidInput());

      expect(result.isNew).toBe(true);
      expect(result.command.status).toBe('classified');

      const publishedEvents = eventPublisher.getPublishedEvents();
      expect(publishedEvents).toHaveLength(1);
      expect(publishedEvents[0]?.type).toBe('action.created');
      expect(publishedEvents[0]?.actionType).toBe('research');
    });
  });

  describe('Branch 7: Unclassified command path', () => {
    it('marks command as classified with unclassified type when classifier returns unclassified', async () => {
      userServiceClient.setApiKeys('user-123', { google: 'test-api-key' });
      classifier.setResult({
        type: 'unclassified',
        confidence: 0.3,
        title: '',
        reasoning: 'No actionable intent detected',
      });

      const usecase = createProcessCommandUseCase({
        commandRepository,
        actionsAgentClient,
        classifierFactory: () => classifier,
        userServiceClient,
        eventPublisher,
        logger,
      });

      const result = await usecase.execute(createValidInput());

      expect(result.isNew).toBe(true);
      expect(result.command.status).toBe('classified');
      expect(result.command.classification).toBeDefined();
      expect(result.command.classification?.type).toBe('unclassified');
      expect(result.command.actionId).toBeUndefined();

      // Verify no action was created
      const createdActions = actionsAgentClient.getCreatedActions();
      expect(createdActions).toHaveLength(0);

      // Verify no event was published
      const publishedEvents = eventPublisher.getPublishedEvents();
      expect(publishedEvents).toHaveLength(0);
    });
  });

  describe('Branch 8: Classification exception', () => {
    it('marks command as failed when classification throws an exception', async () => {
      userServiceClient.setApiKeys('user-123', { google: 'test-api-key' });
      classifier.setFailNext(true);

      const usecase = createProcessCommandUseCase({
        commandRepository,
        actionsAgentClient,
        classifierFactory: () => classifier,
        userServiceClient,
        eventPublisher,
        logger,
      });

      const result = await usecase.execute(createValidInput());

      expect(result.isNew).toBe(true);
      expect(result.command.status).toBe('failed');
      expect(result.command.failureReason).toBe('Simulated classification failure');
      expect(result.command.classification).toBeUndefined();
      expect(result.command.actionId).toBeUndefined();
    });

    it('marks command as failed with generic error message when classification throws non-Error', async () => {
      userServiceClient.setApiKeys('user-123', { google: 'test-api-key' });
      
      // Create a classifier that throws a non-Error object
      const failingClassifier = {
        classify: async (): Promise<never> => {
          throw 'String error';
        },
      };

      const usecase = createProcessCommandUseCase({
        commandRepository,
        actionsAgentClient,
        classifierFactory: () => failingClassifier,
        userServiceClient,
        eventPublisher,
        logger,
      });

      const result = await usecase.execute(createValidInput());

      expect(result.isNew).toBe(true);
      expect(result.command.status).toBe('failed');
      // When non-Error is thrown, getErrorMessage uses the fallback message
      expect(result.command.failureReason).toBe('Unknown classification error');
    });
  });

  describe('Successful classification and action creation', () => {
    it('creates action and publishes event for todo classification', async () => {
      userServiceClient.setApiKeys('user-123', { google: 'test-api-key' });
      classifier.setResult({
        type: 'todo',
        confidence: 0.95,
        title: 'Buy groceries',
        reasoning: 'Clear actionable task',
      });

      const usecase = createProcessCommandUseCase({
        commandRepository,
        actionsAgentClient,
        classifierFactory: () => classifier,
        userServiceClient,
        eventPublisher,
        logger,
      });

      const result = await usecase.execute(createValidInput({ text: 'Buy groceries' }));

      expect(result.isNew).toBe(true);
      expect(result.command.status).toBe('classified');
      expect(result.command.classification?.type).toBe('todo');
      expect(result.command.actionId).toBeDefined();

      const createdActions = actionsAgentClient.getCreatedActions();
      expect(createdActions).toHaveLength(1);
      expect(createdActions[0]?.type).toBe('todo');

      const publishedEvents = eventPublisher.getPublishedEvents();
      expect(publishedEvents).toHaveLength(1);
    });

    it('creates action and publishes event for note classification', async () => {
      userServiceClient.setApiKeys('user-123', { google: 'test-api-key' });
      classifier.setResult({
        type: 'note',
        confidence: 0.92,
        title: 'Meeting notes',
        reasoning: 'Content to be saved',
      });

      const usecase = createProcessCommandUseCase({
        commandRepository,
        actionsAgentClient,
        classifierFactory: () => classifier,
        userServiceClient,
        eventPublisher,
        logger,
      });

      const result = await usecase.execute(createValidInput({ text: 'Note: remember to follow up' }));

      expect(result.isNew).toBe(true);
      expect(result.command.status).toBe('classified');
      expect(result.command.classification?.type).toBe('note');
      expect(result.command.actionId).toBeDefined();
    });

    it('creates action and publishes event for link classification', async () => {
      userServiceClient.setApiKeys('user-123', { google: 'test-api-key' });
      classifier.setResult({
        type: 'link',
        confidence: 0.98,
        title: 'Save article',
        reasoning: 'URL to be bookmarked',
      });

      const usecase = createProcessCommandUseCase({
        commandRepository,
        actionsAgentClient,
        classifierFactory: () => classifier,
        userServiceClient,
        eventPublisher,
        logger,
      });

      const result = await usecase.execute(
        createValidInput({ text: 'https://example.com/article' })
      );

      expect(result.isNew).toBe(true);
      expect(result.command.status).toBe('classified');
      expect(result.command.classification?.type).toBe('link');
      expect(result.command.actionId).toBeDefined();
    });
  });
});
