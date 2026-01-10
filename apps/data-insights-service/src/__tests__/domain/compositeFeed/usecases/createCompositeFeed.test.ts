import { describe, it, expect, beforeEach } from 'vitest';
import type { Result } from '@intexuraos/common-core';
import { err } from '@intexuraos/common-core';
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
import type { DataSource } from '../../../../domain/dataSource/index.js';
import type { CompositeFeed } from '../../../../domain/compositeFeed/index.js';

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
        expect(result.error.message).toBe(
          `Maximum ${String(MAX_STATIC_SOURCES)} static sources allowed`
        );
      }
    });

    it('rejects request exceeding MAX_NOTIFICATION_FILTERS', async () => {
      const tooManyFilters = Array(MAX_NOTIFICATION_FILTERS + 1)
        .fill(null)
        .map((_, i) => ({ id: `filter-${String(i)}`, name: `Filter ${String(i)}` }));

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

    it('rejects empty purpose', async () => {
      const result = await createCompositeFeed(
        'user-1',
        { staticSourceIds: [], notificationFilters: [], purpose: '' },
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

    it('rejects whitespace-only purpose', async () => {
      const result = await createCompositeFeed(
        'user-1',
        { staticSourceIds: [], notificationFilters: [], purpose: '   ' },
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
    it('returns REPOSITORY_ERROR when data source repository fails', async () => {
      // Add a data source first
      await fakeDataSourceRepo.create('user-1', {
        title: 'Test Source',
        content: 'Test content',
      });

      // Override getById to return an error
      fakeDataSourceRepo.getById = async (): Promise<Result<DataSource | null, string>> =>
        err('Database connection failed');

      const result = await createCompositeFeed(
        'user-1',
        { staticSourceIds: ['source-1'], notificationFilters: [], purpose: 'Test' },
        {
          compositeFeedRepository: fakeCompositeFeedRepo,
          dataSourceRepository: fakeDataSourceRepo,
          feedNameGenerationService: fakeFeedNameService,
        }
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('REPOSITORY_ERROR');
        expect(result.error.message).toBe('Database connection failed');
      }
    });

    it('returns SOURCE_NOT_FOUND when source does not exist', async () => {
      const result = await createCompositeFeed(
        'user-1',
        { staticSourceIds: ['missing-source'], notificationFilters: [], purpose: 'Test' },
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
      // Add a data source
      await fakeDataSourceRepo.create('user-1', {
        title: 'Test Source',
        content: 'Test content',
      });

      // Set name generation to fail
      fakeFeedNameService.setError({
        code: 'GENERATION_ERROR',
        message: 'AI service unavailable',
      });

      const result = await createCompositeFeed(
        'user-1',
        { staticSourceIds: ['ds-1'], notificationFilters: [], purpose: 'Test purpose' },
        {
          compositeFeedRepository: fakeCompositeFeedRepo,
          dataSourceRepository: fakeDataSourceRepo,
          feedNameGenerationService: fakeFeedNameService,
        }
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NAME_GENERATION_ERROR');
        expect(result.error.message).toBe('AI service unavailable');
      }
    });
  });

  describe('feed creation', () => {
    it('returns REPOSITORY_ERROR when composite feed repository fails', async () => {
      // Add a data source
      await fakeDataSourceRepo.create('user-1', {
        title: 'Test Source',
        content: 'Test content',
      });

      // Set feed creation to fail
      fakeCompositeFeedRepo.create = async (): Promise<Result<CompositeFeed, string>> =>
        err('Failed to create feed');

      const result = await createCompositeFeed(
        'user-1',
        { staticSourceIds: ['ds-1'], notificationFilters: [], purpose: 'Test purpose' },
        {
          compositeFeedRepository: fakeCompositeFeedRepo,
          dataSourceRepository: fakeDataSourceRepo,
          feedNameGenerationService: fakeFeedNameService,
        }
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('REPOSITORY_ERROR');
        expect(result.error.message).toBe('Failed to create feed');
      }
    });
  });

  describe('success path', () => {
    it('creates composite feed with generated name', async () => {
      // Add a data source
      await fakeDataSourceRepo.create('user-1', {
        title: 'Test Source',
        content: 'Test content',
      });

      // Set generated name
      fakeFeedNameService.setGeneratedName('My Generated Feed');

      const result = await createCompositeFeed(
        'user-1',
        {
          staticSourceIds: ['ds-1'],
          notificationFilters: [{ id: 'f1', name: 'Filter 1' }],
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
        expect(result.value.name).toBe('My Generated Feed');
        expect(result.value.purpose).toBe('Test purpose');
        expect(result.value.staticSourceIds).toEqual(['ds-1']);
        expect(result.value.notificationFilters).toHaveLength(1);
      }
    });

    it('creates composite feed with multiple sources', async () => {
      // Add multiple data sources
      await fakeDataSourceRepo.create('user-1', {
        title: 'Source 1',
        content: 'Content 1',
      });
      await fakeDataSourceRepo.create('user-1', {
        title: 'Source 2',
        content: 'Content 2',
      });

      const result = await createCompositeFeed(
        'user-1',
        {
          staticSourceIds: ['ds-1', 'ds-2'],
          notificationFilters: [],
          purpose: 'Multi-source feed',
        },
        {
          compositeFeedRepository: fakeCompositeFeedRepo,
          dataSourceRepository: fakeDataSourceRepo,
          feedNameGenerationService: fakeFeedNameService,
        }
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.staticSourceIds).toEqual(['ds-1', 'ds-2']);
      }
    });

    it('creates composite feed with multiple filters', async () => {
      const result = await createCompositeFeed(
        'user-1',
        {
          staticSourceIds: [],
          notificationFilters: [
            { id: 'f1', name: 'Filter 1' },
            { id: 'f2', name: 'Filter 2' },
          ],
          purpose: 'Multi-filter feed',
        },
        {
          compositeFeedRepository: fakeCompositeFeedRepo,
          dataSourceRepository: fakeDataSourceRepo,
          feedNameGenerationService: fakeFeedNameService,
        }
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.notificationFilters).toHaveLength(2);
      }
    });
  });
});
