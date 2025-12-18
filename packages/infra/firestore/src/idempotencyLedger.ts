/**
 * Firestore implementation of IdempotencyLedger.
 * Stores operation results keyed by userId + idempotencyKey.
 */
import { ok, err, type Result } from '@praxos/common';
import type { IdempotencyLedger, CreatedNote, NotionError } from '@praxos/domain-promptvault';
import { getFirestore } from './client.js';

const COLLECTION_NAME = 'idempotency_ledger';

/**
 * Document structure in Firestore.
 */
interface IdempotencyDoc {
  userId: string;
  idempotencyKey: string;
  result: CreatedNote;
  createdAt: string;
}

/**
 * Create a composite key for the document.
 */
function makeDocId(userId: string, idempotencyKey: string): string {
  // Use a safe separator that won't appear in either component
  return `${userId}__${idempotencyKey}`;
}

/**
 * Firestore-backed idempotency ledger.
 */
export class FirestoreIdempotencyLedger implements IdempotencyLedger {
  async get(
    userId: string,
    idempotencyKey: string
  ): Promise<Result<CreatedNote | null, NotionError>> {
    try {
      const db = getFirestore();
      const docId = makeDocId(userId, idempotencyKey);
      const docRef = db.collection(COLLECTION_NAME).doc(docId);
      const doc = await docRef.get();

      if (!doc.exists) {
        return ok(null);
      }

      const data = doc.data() as IdempotencyDoc;
      return ok(data.result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Firestore error';
      return err({
        code: 'INTERNAL_ERROR',
        message: `Failed to get idempotency record: ${message}`,
      });
    }
  }

  async set(
    userId: string,
    idempotencyKey: string,
    result: CreatedNote
  ): Promise<Result<void, NotionError>> {
    try {
      const db = getFirestore();
      const docId = makeDocId(userId, idempotencyKey);
      const docRef = db.collection(COLLECTION_NAME).doc(docId);

      const doc: IdempotencyDoc = {
        userId,
        idempotencyKey,
        result,
        createdAt: new Date().toISOString(),
      };

      await docRef.set(doc);
      return ok(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Firestore error';
      return err({
        code: 'INTERNAL_ERROR',
        message: `Failed to set idempotency record: ${message}`,
      });
    }
  }
}
