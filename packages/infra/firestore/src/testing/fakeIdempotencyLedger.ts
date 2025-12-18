/**
 * In-memory test fake for IdempotencyLedger.
 * Lives in infra/firestore for reuse across tests.
 */
import { ok, type Result } from '@praxos/common';
import type { IdempotencyLedger, CreatedNote, NotionError } from '@praxos/domain-promptvault';

/**
 * In-memory fake implementation of IdempotencyLedger.
 * Mimics Firestore behavior for deterministic testing.
 */
export class FakeIdempotencyLedger implements IdempotencyLedger {
  private ledger = new Map<string, CreatedNote>();

  private makeKey(userId: string, idempotencyKey: string): string {
    return `${userId}__${idempotencyKey}`;
  }

  async get(
    userId: string,
    idempotencyKey: string
  ): Promise<Result<CreatedNote | null, NotionError>> {
    const key = this.makeKey(userId, idempotencyKey);
    const result = this.ledger.get(key);
    return await Promise.resolve(ok(result ?? null));
  }

  async set(
    userId: string,
    idempotencyKey: string,
    result: CreatedNote
  ): Promise<Result<void, NotionError>> {
    const key = this.makeKey(userId, idempotencyKey);
    this.ledger.set(key, result);
    return await Promise.resolve(ok(undefined));
  }

  /**
   * Clear all data (for test cleanup).
   */
  clear(): void {
    this.ledger.clear();
  }
}
