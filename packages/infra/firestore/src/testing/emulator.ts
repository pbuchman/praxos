/**
 * Firestore emulator utilities for testing.
 *
 * Detects running emulator or starts a new one for test execution.
 * The production code is completely unaware of emulator configuration -
 * this only affects tests via FIRESTORE_EMULATOR_HOST environment variable.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { Firestore } from '@google-cloud/firestore';

const EMULATOR_HOST = 'localhost';
const EMULATOR_PORT = 8085;
const EMULATOR_HOST_PORT = `${EMULATOR_HOST}:${String(EMULATOR_PORT)}`;

let emulatorProcess: ChildProcess | null = null;

/**
 * Check if Firestore emulator is already running.
 */
export async function isEmulatorRunning(): Promise<boolean> {
  try {
    const response = await fetch(`http://${EMULATOR_HOST_PORT}/`);
    // Emulator returns 200 on root path
    return response.ok || response.status === 404;
  } catch {
    return false;
  }
}

/**
 * Wait for emulator to be ready with health check.
 */
async function waitForEmulator(timeoutMs = 30000): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    if (await isEmulatorRunning()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new Error(`Firestore emulator did not start within ${String(timeoutMs)}ms`);
}

/**
 * Start Firestore emulator if not already running.
 * Sets FIRESTORE_EMULATOR_HOST environment variable.
 *
 * @returns true if a new emulator was started, false if existing emulator was detected
 */
export async function ensureEmulator(): Promise<boolean> {
  // Set emulator host for Firestore SDK to pick up
  process.env['FIRESTORE_EMULATOR_HOST'] = EMULATOR_HOST_PORT;

  // Check if emulator is already running (e.g., via Docker)
  if (await isEmulatorRunning()) {
    return false;
  }

  // Start emulator process
  emulatorProcess = spawn(
    'gcloud',
    ['emulators', 'firestore', 'start', `--host-port=${EMULATOR_HOST_PORT}`],
    {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    }
  );

  emulatorProcess.on('error', (err) => {
    throw new Error(`Failed to start Firestore emulator: ${err.message}`);
  });

  // Wait for emulator to be ready
  await waitForEmulator();

  return true;
}

/**
 * Stop the emulator if it was started by this process.
 */
export function stopEmulator(): void {
  if (emulatorProcess !== null) {
    emulatorProcess.kill('SIGTERM');
    emulatorProcess = null;
  }
}

/**
 * Clear all data from the emulator.
 * Uses Firestore emulator's REST API.
 */
export async function clearEmulatorData(): Promise<void> {
  const projectId = process.env['GCLOUD_PROJECT'] ?? 'test-project';
  const url = `http://${EMULATOR_HOST_PORT}/emulator/v1/projects/${projectId}/databases/(default)/documents`;

  try {
    const response = await fetch(url, { method: 'DELETE' });
    if (!response.ok && response.status !== 404) {
      throw new Error(`Failed to clear emulator data: ${response.statusText}`);
    }
  } catch (error) {
    // Ignore network errors - emulator might not support this endpoint in older versions
    if (error instanceof Error && !error.message.includes('Failed to clear')) {
      // Network error, try alternative approach by deleting collections
      return;
    }
    throw error;
  }
}

/**
 * Create a Firestore instance configured for the emulator.
 * This is for test utilities only - production code uses getFirestore() from client.ts.
 */
export function createEmulatorFirestore(): Firestore {
  return new Firestore({
    projectId: process.env['GCLOUD_PROJECT'] ?? 'test-project',
  });
}

/**
 * Get the emulator host string.
 */
export function getEmulatorHost(): string {
  return EMULATOR_HOST_PORT;
}
