/**
 * @praxos/infra-firestore
 *
 * Firestore infrastructure adapter - implements domain persistence ports.
 *
 * Structure:
 * - client.ts                      Firestore client singleton
 * - authTokenRepository.ts         Per-user Auth0 token storage (encrypted)
 * - notionConnectionRepository.ts  Per-user Notion config storage
 * - idempotencyLedger.ts          Idempotency tracking
 * - encryption.ts                  Token encryption utilities
 * - testing/                       Test fakes for use in other packages
 */

// Client
export { getFirestore, resetFirestore, setFirestore } from './client.js';

// Adapters
export { FirestoreAuthTokenRepository } from './authTokenRepository.js';
export { FirestoreNotionConnectionRepository } from './notionConnectionRepository.js';
export { FirestoreIdempotencyLedger } from './idempotencyLedger.js';

// Encryption utilities
export { encryptToken, decryptToken, generateEncryptionKey } from './encryption.js';

// Testing utilities (for use by consuming packages)
export { FakeNotionConnectionRepository, FakeIdempotencyLedger } from './testing/index.js';
