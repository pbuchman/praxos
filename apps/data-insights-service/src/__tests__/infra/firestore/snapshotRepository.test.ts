/**
 * Tests for Snapshot Firestore repository.
 * Uses FakeFirestore for in-memory testing.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createFakeFirestore, resetFirestore, setFirestore } from '@intexuraos/infra-firestore';
import type { Firestore } from '@google-cloud/firestore';
import { FirestoreSnapshotRepository } from '../../../infra/firestore/snapshotRepository.js';
import type { CompositeFeedData } from '../../../domain/compositeFeed/schemas/index.js';

describe('FirestoreSnapshotRepository', () => {
  let fakeFirestore: ReturnType<typeof createFakeFirestore>;
  let repository: FirestoreSnapshotRepository;
  const userId = 'user-123';
  const feedId = 'feed-456';

  const createTestFeedData = (): CompositeFeedData => ({
    feedId,
    feedName: 'Test Feed',
    purpose: 'Test purpose',
    generatedAt: new Date().toISOString(),
    staticSources: [
      {
        id: 'source-1',
        name: 'Source 1',
        content: 'Test content',
      },
    ],
    notifications: [],
  });

  beforeEach(() => {
    fakeFirestore = createFakeFirestore();
    setFirestore(fakeFirestore as unknown as Firestore);
    repository = new FirestoreSnapshotRepository();
  });

  afterEach(() => {
    resetFirestore();
  });

  describe('getByFeedId', () => {
    it('returns snapshot when exists and userId matches', async () => {
      const feedData = createTestFeedData();
      await repository.upsert(feedId, userId, 'Test Feed', feedData);

      const result = await repository.getByFeedId(feedId, userId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).not.toBeNull();
        expect(result.value?.feedId).toBe(feedId);
        expect(result.value?.userId).toBe(userId);
        expect(result.value?.feedName).toBe('Test Feed');
        expect(result.value?.data).toEqual(feedData);
        expect(result.value?.generatedAt).toBeInstanceOf(Date);
        expect(result.value?.expiresAt).toBeInstanceOf(Date);
      }
    });

    it('returns null when snapshot does not exist', async () => {
      const result = await repository.getByFeedId('non-existent', userId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeNull();
      }
    });

    it('returns null when userId does not match', async () => {
      const feedData = createTestFeedData();
      await repository.upsert(feedId, userId, 'Test Feed', feedData);

      const result = await repository.getByFeedId(feedId, 'other-user');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeNull();
      }
    });

    it('returns error on Firestore failure', async () => {
      fakeFirestore.configure({ errorToThrow: new Error('Connection timeout') });

      const result = await repository.getByFeedId(feedId, userId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('Failed to get snapshot');
      }

      fakeFirestore.configure({});
    });
  });

  describe('upsert', () => {
    it('creates a new snapshot successfully', async () => {
      const feedData = createTestFeedData();

      const result = await repository.upsert(feedId, userId, 'Test Feed', feedData);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe(feedId);
        expect(result.value.userId).toBe(userId);
        expect(result.value.feedId).toBe(feedId);
        expect(result.value.feedName).toBe('Test Feed');
        expect(result.value.data).toEqual(feedData);
        expect(result.value.generatedAt).toBeInstanceOf(Date);
        expect(result.value.expiresAt).toBeInstanceOf(Date);
      }
    });

    it('updates an existing snapshot', async () => {
      const feedData1 = createTestFeedData();
      await repository.upsert(feedId, userId, 'Original Name', feedData1);

      const feedData2 = createTestFeedData();
      feedData2.purpose = 'Updated purpose';
      const result = await repository.upsert(feedId, userId, 'Updated Name', feedData2);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.feedName).toBe('Updated Name');
        expect(result.value.data.purpose).toBe('Updated purpose');
      }
    });

    it('returns error on Firestore failure', async () => {
      fakeFirestore.configure({ errorToThrow: new Error('Write failed') });

      const feedData = createTestFeedData();
      const result = await repository.upsert(feedId, userId, 'Test Feed', feedData);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('Failed to upsert snapshot');
      }

      fakeFirestore.configure({});
    });
  });

  describe('delete', () => {
    it('deletes snapshot when exists and userId matches', async () => {
      const feedData = createTestFeedData();
      await repository.upsert(feedId, userId, 'Test Feed', feedData);

      const deleteResult = await repository.delete(feedId, userId);

      expect(deleteResult.ok).toBe(true);

      const getResult = await repository.getByFeedId(feedId, userId);
      expect(getResult.ok).toBe(true);
      if (getResult.ok) {
        expect(getResult.value).toBeNull();
      }
    });

    it('returns ok(undefined) when snapshot does not exist', async () => {
      const result = await repository.delete('non-existent', userId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeUndefined();
      }
    });

    it('returns ok(undefined) when userId does not match', async () => {
      const feedData = createTestFeedData();
      await repository.upsert(feedId, userId, 'Test Feed', feedData);

      const result = await repository.delete(feedId, 'other-user');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeUndefined();
      }

      const getResult = await repository.getByFeedId(feedId, userId);
      expect(getResult.ok).toBe(true);
      if (getResult.ok) {
        expect(getResult.value).not.toBeNull();
      }
    });

    it('returns error on Firestore failure', async () => {
      fakeFirestore.configure({ errorToThrow: new Error('Delete failed') });

      const result = await repository.delete(feedId, userId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('Failed to delete snapshot');
      }

      fakeFirestore.configure({});
    });
  });

  describe('deleteByFeedId', () => {
    it('deletes snapshot without userId check', async () => {
      const feedData = createTestFeedData();
      await repository.upsert(feedId, userId, 'Test Feed', feedData);

      const deleteResult = await repository.deleteByFeedId(feedId);

      expect(deleteResult.ok).toBe(true);

      const getResult = await repository.getByFeedId(feedId, userId);
      expect(getResult.ok).toBe(true);
      if (getResult.ok) {
        expect(getResult.value).toBeNull();
      }
    });

    it('is idempotent when snapshot does not exist', async () => {
      const result = await repository.deleteByFeedId('non-existent');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeUndefined();
      }
    });

    it('returns error on Firestore failure', async () => {
      fakeFirestore.configure({ errorToThrow: new Error('Delete failed') });

      const result = await repository.deleteByFeedId(feedId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('Failed to delete snapshot by feed ID');
      }

      fakeFirestore.configure({});
    });
  });

  describe('listByUserId', () => {
    it('returns snapshots for user ordered by generatedAt desc', async () => {
      const feedData1 = createTestFeedData();
      await repository.upsert('feed-1', userId, 'Feed 1', feedData1);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const feedData2 = createTestFeedData();
      await repository.upsert('feed-2', userId, 'Feed 2', feedData2);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const feedData3 = createTestFeedData();
      await repository.upsert('feed-3', userId, 'Feed 3', feedData3);

      const result = await repository.listByUserId(userId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(3);
        expect(result.value[0]?.feedName).toBe('Feed 3');
        expect(result.value[1]?.feedName).toBe('Feed 2');
        expect(result.value[2]?.feedName).toBe('Feed 1');
      }
    });

    it('returns empty array when no snapshots exist', async () => {
      const result = await repository.listByUserId(userId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([]);
      }
    });

    it('only returns snapshots for the specified user', async () => {
      const feedData1 = createTestFeedData();
      await repository.upsert('feed-1', userId, 'User Feed', feedData1);

      const feedData2 = createTestFeedData();
      await repository.upsert('feed-2', 'other-user', 'Other Feed', feedData2);

      const result = await repository.listByUserId(userId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0]?.userId).toBe(userId);
      }
    });

    it('returns error on Firestore failure', async () => {
      fakeFirestore.configure({ errorToThrow: new Error('Query failed') });

      const result = await repository.listByUserId(userId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('Failed to list snapshots');
      }

      fakeFirestore.configure({});
    });
  });
});
