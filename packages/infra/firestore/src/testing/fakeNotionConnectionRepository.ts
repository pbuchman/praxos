/**
 * In-memory test fake for NotionConnectionRepository.
 * Lives in infra/firestore for reuse across tests.
 */
import { ok, type Result } from '@praxos/common';
import type {
  NotionConnectionRepository,
  NotionConnectionPublic,
  NotionError,
} from '@praxos/domain-promptvault';

/**
 * In-memory Notion connection storage for testing.
 */
interface ConnectionRecord {
  userId: string;
  promptVaultPageId: string;
  notionToken: string;
  connected: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * In-memory fake implementation of NotionConnectionRepository.
 * Mimics Firestore behavior for deterministic testing.
 */
export class FakeNotionConnectionRepository implements NotionConnectionRepository {
  private connections = new Map<string, ConnectionRecord>();

  async saveConnection(
    userId: string,
    promptVaultPageId: string,
    notionToken: string
  ): Promise<Result<NotionConnectionPublic, NotionError>> {
    const now = new Date().toISOString();
    const existing = this.connections.get(userId);

    const record: ConnectionRecord = {
      userId,
      promptVaultPageId,
      notionToken,
      connected: true,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    this.connections.set(userId, record);

    return await Promise.resolve(
      ok({
        promptVaultPageId: record.promptVaultPageId,
        connected: record.connected,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      })
    );
  }

  async getConnection(userId: string): Promise<Result<NotionConnectionPublic | null, NotionError>> {
    const record = this.connections.get(userId);
    if (record === undefined) {
      return await Promise.resolve(ok(null));
    }

    return await Promise.resolve(
      ok({
        promptVaultPageId: record.promptVaultPageId,
        connected: record.connected,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      })
    );
  }

  async disconnectConnection(userId: string): Promise<Result<NotionConnectionPublic, NotionError>> {
    const now = new Date().toISOString();
    const record = this.connections.get(userId);

    if (record !== undefined) {
      record.connected = false;
      record.updatedAt = now;
    }

    return await Promise.resolve(
      ok({
        promptVaultPageId: record?.promptVaultPageId ?? '',
        connected: false,
        createdAt: record?.createdAt ?? now,
        updatedAt: now,
      })
    );
  }

  async isConnected(userId: string): Promise<Result<boolean, NotionError>> {
    const record = this.connections.get(userId);
    if (record === undefined) {
      return await Promise.resolve(ok(false));
    }
    return await Promise.resolve(ok(record.connected));
  }

  async getToken(userId: string): Promise<Result<string | null, NotionError>> {
    const record = this.connections.get(userId);
    if (record === undefined) {
      return await Promise.resolve(ok(null));
    }
    if (!record.connected) {
      return await Promise.resolve(ok(null));
    }
    return await Promise.resolve(ok(record.notionToken));
  }

  /**
   * Clear all data (for test cleanup).
   */
  clear(): void {
    this.connections.clear();
  }
}
