/**
 * @praxos/infra-firestore
 *
 * Firestore infrastructure adapter - implements domain persistence ports.
 *
 * Structure:
 * - client.ts                      Firestore client singleton
 * - notionConnectionRepository.ts  Per-user Notion config storage
 * - idempotencyLedger.ts          Idempotency tracking
 * - testing/                       Test fakes for use in other packages
 */

// Client
export { getFirestore, resetFirestore, setFirestore } from './client.js';

// Adapters
export { FirestoreNotionConnectionRepository } from './notionConnectionRepository.js';
export { FirestoreIdempotencyLedger } from './idempotencyLedger.js';

// Testing utilities (for use by consuming packages)
export { FakeNotionConnectionRepository, FakeIdempotencyLedger } from './testing/index.js';
