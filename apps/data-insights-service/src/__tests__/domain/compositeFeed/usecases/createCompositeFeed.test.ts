import { describe, it, expect, beforeEach } from 'vitest';
import { createCompositeFeed } from '../../../../domain/compositeFeed/usecases/createCompositeFeed.js';
import {
  MAX_STATIC_SOURCES,
  MAX_NOTIFICATION_FILTERS,
} from '../../../../domain/compositeFeed/models/index.js';
import {
  FakeCompositeFeedRepository,
  FakeDataSourceRepository,
  FakeFeedNameGenerationService,
} from '../../../fakes.js';

describe('createCompositeFeed', () => {
  let fakeCompositeFeedRepo: FakeCompositeFeedRepository;
  let fakeDataSourceRepo: FakeDataSourceRepository;
  let fakeFeedNameService: FakeFeedNameGenerationService;

  beforeEach(() => {
    fakeCompositeFeedRepo = new FakeCompositeFeedRepository();
    fakeDataSourceRepo = new FakeDataSourceRepository();
    fakeFeedNameService = new FakeFeedNameGenerationService();
  });

  describe('validation', () => {
    it('rejects request exceeding MAX_STATIC_SOURCES', async () => {
      const tooManySources = Array(MAX_STATIC_SOURCES + 1).fill('source-id');
      const result = await createCompositeFeed(
        'user-1',
        {
          staticSourceIds: tooManySources,
          notificationFilters: [],
          purpose: 'Test',
        },
        {
          compositeFeedRepository: fakeCompositeFeedRepo,
          dataSourceRepository: fakeDataSourceRepo,
          feedNameGenerationService: fakeFeedNameService,
        }
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toBe(`Maximum ${String(MAX_STATIC_SOURCES)} static sources allowed`);
      }
    });

    it('rejects request exceeding MAX_NOTIFICATION_FILTERS', async () => {
      const tooManyFilters = Array(MAX_NOTIFICATION_FILTERS + 1)
        .fill(null)
        .map((_, idx) => ({
          id: `filter-${String(idx)}`,
          name: `Filter ${String(idx)}`,
        }));

      const result = await createCompositeFeed(
        'user-1',
        {
          staticSourceIds: [],
          notificationFilters: tooManyFilters,
          purpose: 'Test',
        },
        {
          compositeFeedRepository: fakeCompositeFeedRepo,
          dataSourceRepository: fakeDataSourceRepo,
          feedNameGenerationService: fakeFeedNameService,
        }
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toBe(
          `Maximum ${String(MAX_NOTIFICATION_FILTERS)} notification filters allowed`
        );
      }
    });

    it('rejects empty purpose string', async () => {
      const result = await createCompositeFeed(
        'user-1',
        {
          staticSourceIds: [],
          notificationFilters: [],
          purpose: '',
        },
        {
          compositeFeedRepository: fakeCompositeFeedRepo,
          dataSourceRepository: fakeDataSourceRepo,
          feedNameGenerationService: fakeFeedNameService,
        }
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toBe('Purpose is required');
      }
    });

    it('rejects whitespace-only purpose string', async () => {
      const result = await createCompositeFeed(
        'user-1',
        {
          staticSourceIds: [],
          notificationFilters: [],
          purpose: '   ',
        },
        {
          compositeFeedRepository: fakeCompositeFeedRepo,
          dataSourceRepository: fakeDataSourceRepo,
          feedNameGenerationService: fakeFeedNameService,
        }
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toBe('Purpose is required');
      }
    });
  });

  describe('source validation', () => {
    it('returns REPOSITORY_ERROR when dataSourceRepository.getById fails', async () => {
      const sourceResult = await fakeDataSourceRepo.create('user-1', {
        title: 'Test Source',
        content: 'Test content',
      });
      const source = sourceResult.ok ? sourceResult.value : null;

      fakeDataSourceRepo.setFailNextGet(true);

      const result = await createCompositeFeed(
        'user-1',
        {
          staticSourceIds: [source?.id ?? ''],
          notificationFilters: [],
          purpose: 'Test purpose',
        },
        {
          compositeFeedRepository: fakeCompositeFeedRepo,
          dataSourceRepository: fakeDataSourceRepo,
          feedNameGenerationService: fakeFeedNameService,
        }
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('REPOSITORY_ERROR');
        expect(result.error.message).toBe('Simulated get failure');
      }
    });

    it('returns SOURCE_NOT_FOUND when source does not exist', async () => {
      const result = await createCompositeFeed(
        'user-1',
        {
          staticSourceIds: ['missing-source'],
          notificationFilters: [],
          purpose: 'Test purpose',
        },
        {
          compositeFeedRepository: fakeCompositeFeedRepo,
          dataSourceRepository: fakeDataSourceRepo,
          feedNameGenerationService: fakeFeedNameService,
        }
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('SOURCE_NOT_FOUND');
        expect(result.error.message).toBe('Data source not found: missing-source');
      }
    });
  });

  describe('name generation', () => {
    it('returns NAME_GENERATION_ERROR when name generation fails', async () => {
      fakeFeedNameService.setError({
        code: 'GENERATION_ERROR',
        message: 'Failed to generate name',
      });

      const result = await createCompositeFeed(
        'user-1',
        {
          staticSourceIds: [],
          notificationFilters: [],
          purpose: 'Test purpose',
        },
        {
          compositeFeedRepository: fakeCompositeFeedRepo,
          dataSourceRepository: fakeDataSourceRepo,
          feedNameGenerationService: fakeFeedNameService,
        }
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NAME_GENERATION_ERROR');
        expect(result.error.message).toBe('Failed to generate name');
      }
    });
  });

  describe('repository errors', () => {
    it('returns REPOSITORY_ERROR when compositeFeedRepository.create fails', async () => {
      fakeCompositeFeedRepo.setFailNextCreate(true);

      const result = await createCompositeFeed(
        'user-1',
        {
          staticSourceIds: [],
          notificationFilters: [],
          purpose: 'Test purpose',
        },
        {
          compositeFeedRepository: fakeCompositeFeedRepo,
          dataSourceRepository: fakeDataSourceRepo,
          feedNameGenerationService: fakeFeedNameService,
        }
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('REPOSITORY_ERROR');
        expect(result.error.message).toBe('Simulated create failure');
      }
    });
  });

  describe('success path', () => {
    it('creates composite feed with generated name', async () => {
      const sourceResult = await fakeDataSourceRepo.create('user-1', {
        title: 'Source 1',
        content: 'Content 1',
      });
      const source = sourceResult.ok ? sourceResult.value : null;

      fakeFeedNameService.setGeneratedName('AI Generated Feed Name');

      const result = await createCompositeFeed(
        'user-1',
        {
          staticSourceIds: [source?.id ?? ''],
          notificationFilters: [{ id: 'filter-1', name: 'Filter 1' }],
          purpose: 'Test purpose',
        },
        {
          compositeFeedRepository: fakeCompositeFeedRepo,
          dataSourceRepository: fakeDataSourceRepo,
          feedNameGenerationService: fakeFeedNameService,
        }
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.name).toBe('AI Generated Feed Name');
        expect(result.value.purpose).toBe('Test purpose');
        expect(result.value.staticSourceIds).toContain(source?.id);
        expect(result.value.notificationFilters).toHaveLength(1);
      }
    });

    it('creates feed with no static sources', async () => {
      fakeFeedNameService.setGeneratedName('Feed with no sources');

      const result = await createCompositeFeed(
        'user-1',
        {
          staticSourceIds: [],
          notificationFilters: [{ id: 'filter-1', name: 'Filter 1' }],
          purpose: 'Test purpose',
        },
        {
          compositeFeedRepository: fakeCompositeFeedRepo,
          dataSourceRepository: fakeDataSourceRepo,
          feedNameGenerationService: fakeFeedNameService,
        }
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.staticSourceIds).toHaveLength(0);
        expect(result.value.notificationFilters).toHaveLength(1);
      }
    });

    it('creates feed with multiple static sources', async () => {
      const source1Result = await fakeDataSourceRepo.create('user-1', {
        title: 'Source 1',
        content: 'Content 1',
      });
      const source2Result = await fakeDataSourceRepo.create('user-1', {
        title: 'Source 2',
        content: 'Content 2',
      });

      const source1 = source1Result.ok ? source1Result.value : null;
      const source2 = source2Result.ok ? source2Result.value : null;

      fakeFeedNameService.setGeneratedName('Multi-source feed');

      const result = await createCompositeFeed(
        'user-1',
        {
          staticSourceIds: [source1?.id ?? '', source2?.id ?? ''],
          notificationFilters: [],
          purpose: 'Test purpose',
        },
        {
          compositeFeedRepository: fakeCompositeFeedRepo,
          dataSourceRepository: fakeDataSourceRepo,
          feedNameGenerationService: fakeFeedNameService,
        }
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.staticSourceIds).toHaveLength(2);
        expect(result.value.staticSourceIds).toContain(source1?.id);
        expect(result.value.staticSourceIds).toContain(source2?.id);
      }
    });
  });
});
