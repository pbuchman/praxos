import { describe, it, expect, beforeEach } from 'vitest';
import { LlmModels } from '@intexuraos/llm-contract';
import { createProcessCommandUseCase } from '../../domain/usecases/processCommand.js';
import type { Command } from '../../domain/models/command.js';
import type { ProcessCommandInput } from '../../domain/usecases/processCommand.js';
import {
  FakeCommandRepository,
  FakeActionsAgentClient,
  FakeClassifier,
  FakeUserServiceClient,
  FakeEventPublisher,
} from '../fakes.js';
import pino from 'pino';

describe('processCommand usecase', () => {
  let commandRepository: FakeCommandRepository;
  let actionsAgentClient: FakeActionsAgentClient;
  let classifier: FakeClassifier;
  let userServiceClient: FakeUserServiceClient;
  let eventPublisher: FakeEventPublisher;
  const logger = pino({ name: 'test', level: 'silent' });

  const createInput = (overrides: Partial<ProcessCommandInput> = {}): ProcessCommandInput => ({
    userId: 'user-123',
    sourceType: 'whatsapp_text',
    externalId: 'msg-456',
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

    // Default: user has Google API key
    userServiceClient.setApiKeys('user-123', { google: 'google-api-key' });

    // Default: classifier returns a research classification
    classifier.setResult({
      type: 'research',
      confidence: 0.9,
      title: 'AI Trends Research',
      reasoning: 'Research task',
    });
  });

  describe('idempotency - existing command', () => {
    it('returns existing command without processing when command already exists', async () => {
      const existingCommand: Command = {
        id: 'whatsapp_text:msg-456',
        userId: 'user-123',
        sourceType: 'whatsapp_text',
        externalId: 'msg-456',
        text: 'Research AI trends',
        timestamp: '2025-01-01T12:00:00.000Z',
        status: 'classified',
        classification: {
          type: 'research',
          confidence: 0.9,
          reasoning: 'Research task',
          classifiedAt: '2025-01-01T12:01:00.000Z',
        },
        actionId: 'action-123',
        createdAt: '2025-01-01T12:00:00.000Z',
        updatedAt: '2025-01-01T12:01:00.000Z',
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

      const result = await usecase.execute(createInput());

      expect(result.isNew).toBe(false);
      expect(result.command).toEqual(existingCommand);
      expect(result.command.id).toBe('whatsapp_text:msg-456');
      expect(result.command.status).toBe('classified');

      // Verify no new actions were created
      const actions = actionsAgentClient.getCreatedActions();
      expect(actions).toHaveLength(0);
    });
  });

  describe('API key failures', () => {
    it('marks command pending_classification when API keys fetch fails', async () => {
      userServiceClient.setFailNext(true);

      const usecase = createProcessCommandUseCase({
        commandRepository,
        actionsAgentClient,
        classifierFactory: () => classifier,
        userServiceClient,
        eventPublisher,
        logger,
      });

      const result = await usecase.execute(createInput());

      expect(result.isNew).toBe(true);
      expect(result.command.status).toBe('pending_classification');
      expect(result.command.classification).toBeUndefined();
      expect(result.command.actionId).toBeUndefined();

      // Verify command was saved in repository
      const savedCommand = await commandRepository.getById(result.command.id);
      expect(savedCommand?.status).toBe('pending_classification');

      // Verify no actions or events were created
      expect(actionsAgentClient.getCreatedActions()).toHaveLength(0);
      expect(eventPublisher.getPublishedEvents()).toHaveLength(0);
    });

    it('marks command pending_classification when user has no Google API key', async () => {
      userServiceClient.setApiKeys('user-123', {}); // No google key

      const usecase = createProcessCommandUseCase({
        commandRepository,
        actionsAgentClient,
        classifierFactory: () => classifier,
        userServiceClient,
        eventPublisher,
        logger,
      });

      const result = await usecase.execute(createInput());

      expect(result.isNew).toBe(true);
      expect(result.command.status).toBe('pending_classification');
      expect(result.command.classification).toBeUndefined();
      expect(result.command.actionId).toBeUndefined();

      // Verify command was saved in repository
      const savedCommand = await commandRepository.getById(result.command.id);
      expect(savedCommand?.status).toBe('pending_classification');

      // Verify no actions or events were created
      expect(actionsAgentClient.getCreatedActions()).toHaveLength(0);
      expect(eventPublisher.getPublishedEvents()).toHaveLength(0);
    });
  });

  describe('action creation failure', () => {
    it('marks command as failed when action creation fails', async () => {
      actionsAgentClient.setFailNext(true);

      const usecase = createProcessCommandUseCase({
        commandRepository,
        actionsAgentClient,
        classifierFactory: () => classifier,
        userServiceClient,
        eventPublisher,
        logger,
      });

      const result = await usecase.execute(createInput());

      expect(result.isNew).toBe(true);
      expect(result.command.status).toBe('failed');
      expect(result.command.failureReason).toContain('Actions-agent client error');
      expect(result.command.classification).toBeUndefined();
      expect(result.command.actionId).toBeUndefined();

      // Verify command was updated in repository
      const savedCommand = await commandRepository.getById(result.command.id);
      expect(savedCommand?.status).toBe('failed');
      expect(savedCommand?.failureReason).toContain('Actions-agent client error');

      // Verify no events were published
      expect(eventPublisher.getPublishedEvents()).toHaveLength(0);
    });
  });

  describe('selectedModels in event payload', () => {
    it('includes selectedModels in event payload when present in classification', async () => {
      classifier.setResult({
        type: 'research',
        confidence: 0.95,
        title: 'AI Research',
        reasoning: 'Research task',
        selectedModels: [LlmModels.Gemini25Flash, LlmModels.O4MiniDeepResearch],
      });

      const usecase = createProcessCommandUseCase({
        commandRepository,
        actionsAgentClient,
        classifierFactory: () => classifier,
        userServiceClient,
        eventPublisher,
        logger,
      });

      const result = await usecase.execute(createInput());

      expect(result.command.status).toBe('classified');

      const events = eventPublisher.getPublishedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]?.payload.selectedModels).toEqual([
        LlmModels.Gemini25Flash,
        LlmModels.O4MiniDeepResearch,
      ]);
    });

    it('does not include selectedModels in event payload when undefined in classification', async () => {
      classifier.setResult({
        type: 'research',
        confidence: 0.95,
        title: 'AI Research',
        reasoning: 'Research task',
        // selectedModels omitted - testing undefined case
      });

      const usecase = createProcessCommandUseCase({
        commandRepository,
        actionsAgentClient,
        classifierFactory: () => classifier,
        userServiceClient,
        eventPublisher,
        logger,
      });

      const result = await usecase.execute(createInput());

      expect(result.command.status).toBe('classified');

      const events = eventPublisher.getPublishedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]?.payload.selectedModels).toBeUndefined();
    });
  });

  describe('event publishing', () => {
    it('continues processing when event publishing fails', async () => {
      eventPublisher.setFailNext(true);

      const usecase = createProcessCommandUseCase({
        commandRepository,
        actionsAgentClient,
        classifierFactory: () => classifier,
        userServiceClient,
        eventPublisher,
        logger,
      });

      const result = await usecase.execute(createInput());

      // Command should still be marked as classified despite publish failure
      expect(result.isNew).toBe(true);
      expect(result.command.status).toBe('classified');
      expect(result.command.actionId).toBeDefined();
      expect(result.command.classification?.type).toBe('research');

      // Verify action was created
      const actions = actionsAgentClient.getCreatedActions();
      expect(actions).toHaveLength(1);

      // Verify command was updated in repository
      const savedCommand = await commandRepository.getById(result.command.id);
      expect(savedCommand?.status).toBe('classified');
    });

    it('publishes event successfully when no errors occur', async () => {
      const usecase = createProcessCommandUseCase({
        commandRepository,
        actionsAgentClient,
        classifierFactory: () => classifier,
        userServiceClient,
        eventPublisher,
        logger,
      });

      const result = await usecase.execute(createInput());

      expect(result.command.status).toBe('classified');

      const events = eventPublisher.getPublishedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]?.type).toBe('action.created');
      expect(events[0]?.actionType).toBe('research');
      expect(events[0]?.userId).toBe('user-123');
    });
  });

  describe('unclassified command path', () => {
    it('marks command as classified without creating action when type is unclassified', async () => {
      classifier.setResult({
        type: 'unclassified',
        confidence: 0.2,
        title: 'Unknown Command',
        reasoning: 'Cannot determine actionable intent',
      });

      const usecase = createProcessCommandUseCase({
        commandRepository,
        actionsAgentClient,
        classifierFactory: () => classifier,
        userServiceClient,
        eventPublisher,
        logger,
      });

      const result = await usecase.execute(createInput());

      expect(result.isNew).toBe(true);
      expect(result.command.status).toBe('classified');
      expect(result.command.classification?.type).toBe('unclassified');
      expect(result.command.classification?.confidence).toBe(0.2);
      expect(result.command.actionId).toBeUndefined();

      // Verify no actions were created
      const actions = actionsAgentClient.getCreatedActions();
      expect(actions).toHaveLength(0);

      // Verify no events were published
      const events = eventPublisher.getPublishedEvents();
      expect(events).toHaveLength(0);

      // Verify command was updated in repository
      const savedCommand = await commandRepository.getById(result.command.id);
      expect(savedCommand?.status).toBe('classified');
      expect(savedCommand?.classification?.type).toBe('unclassified');
    });
  });

  describe('classification exception', () => {
    it('marks command as failed when classification throws exception', async () => {
      classifier.setFailNext(true);

      const usecase = createProcessCommandUseCase({
        commandRepository,
        actionsAgentClient,
        classifierFactory: () => classifier,
        userServiceClient,
        eventPublisher,
        logger,
      });

      const result = await usecase.execute(createInput());

      expect(result.isNew).toBe(true);
      expect(result.command.status).toBe('failed');
      expect(result.command.failureReason).toContain('Simulated classification failure');
      expect(result.command.classification).toBeUndefined();
      expect(result.command.actionId).toBeUndefined();

      // Verify command was updated in repository
      const savedCommand = await commandRepository.getById(result.command.id);
      expect(savedCommand?.status).toBe('failed');
      expect(savedCommand?.failureReason).toContain('Simulated classification failure');

      // Verify no actions or events were created
      expect(actionsAgentClient.getCreatedActions()).toHaveLength(0);
      expect(eventPublisher.getPublishedEvents()).toHaveLength(0);
    });
  });

  describe('successful classification with action creation', () => {
    it('processes todo command successfully', async () => {
      classifier.setResult({
        type: 'todo',
        confidence: 0.92,
        title: 'Buy groceries',
        reasoning: 'Contains task keywords',
      });

      const usecase = createProcessCommandUseCase({
        commandRepository,
        actionsAgentClient,
        classifierFactory: () => classifier,
        userServiceClient,
        eventPublisher,
        logger,
      });

      const result = await usecase.execute(createInput({ text: 'Buy groceries tomorrow' }));

      expect(result.isNew).toBe(true);
      expect(result.command.status).toBe('classified');
      expect(result.command.classification?.type).toBe('todo');
      expect(result.command.classification?.confidence).toBe(0.92);
      expect(result.command.actionId).toBeDefined();

      // Verify action was created
      const actions = actionsAgentClient.getCreatedActions();
      expect(actions).toHaveLength(1);
      expect(actions[0]?.type).toBe('todo');

      // Verify event was published
      const events = eventPublisher.getPublishedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]?.actionType).toBe('todo');
    });

    it('processes note command successfully', async () => {
      classifier.setResult({
        type: 'note',
        confidence: 0.88,
        title: 'Meeting notes',
        reasoning: 'Note-taking intent',
      });

      const usecase = createProcessCommandUseCase({
        commandRepository,
        actionsAgentClient,
        classifierFactory: () => classifier,
        userServiceClient,
        eventPublisher,
        logger,
      });

      const result = await usecase.execute(createInput({ text: 'Remember to call John' }));

      expect(result.isNew).toBe(true);
      expect(result.command.status).toBe('classified');
      expect(result.command.classification?.type).toBe('note');
      expect(result.command.actionId).toBeDefined();

      // Verify action was created
      const actions = actionsAgentClient.getCreatedActions();
      expect(actions).toHaveLength(1);
      expect(actions[0]?.type).toBe('note');
    });
  });
});
