/**
 * Stub in-memory store for notion-gpt-service.
 * Step 5 only - will be replaced with Firestore in later steps.
 */

interface NotionConfig {
  promptVaultPageId: string;
  notionToken: string; // stored but NEVER returned
  connected: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreatedNote {
  id: string;
  url: string;
  title: string;
  createdAt: string;
}

interface UserStore {
  notionConfig: NotionConfig | null;
  idempotencyMap: Map<string, CreatedNote>;
}

const store = new Map<string, UserStore>();

function getUserStore(userId: string): UserStore {
  let userStore = store.get(userId);
  if (!userStore) {
    userStore = {
      notionConfig: null,
      idempotencyMap: new Map(),
    };
    store.set(userId, userStore);
  }
  return userStore;
}

export interface NotionConfigPublic {
  promptVaultPageId: string;
  connected: boolean;
  createdAt: string;
  updatedAt: string;
}

export function setNotionConfig(
  userId: string,
  promptVaultPageId: string,
  notionToken: string
): NotionConfigPublic {
  const userStore = getUserStore(userId);
  const now = new Date().toISOString();

  userStore.notionConfig = {
    promptVaultPageId,
    notionToken,
    connected: true,
    createdAt: userStore.notionConfig?.createdAt ?? now,
    updatedAt: now,
  };

  return {
    promptVaultPageId: userStore.notionConfig.promptVaultPageId,
    connected: userStore.notionConfig.connected,
    createdAt: userStore.notionConfig.createdAt,
    updatedAt: userStore.notionConfig.updatedAt,
  };
}

export function getNotionConfig(userId: string): NotionConfigPublic | null {
  const userStore = getUserStore(userId);
  if (!userStore.notionConfig) {
    return null;
  }
  return {
    promptVaultPageId: userStore.notionConfig.promptVaultPageId,
    connected: userStore.notionConfig.connected,
    createdAt: userStore.notionConfig.createdAt,
    updatedAt: userStore.notionConfig.updatedAt,
  };
}

export function removeNotionConfig(userId: string): NotionConfigPublic {
  const userStore = getUserStore(userId);
  const now = new Date().toISOString();

  if (userStore.notionConfig) {
    userStore.notionConfig.connected = false;
    userStore.notionConfig.updatedAt = now;
  }

  return {
    promptVaultPageId: userStore.notionConfig?.promptVaultPageId ?? '',
    connected: false,
    createdAt: userStore.notionConfig?.createdAt ?? now,
    updatedAt: now,
  };
}

export function isNotionConfigured(userId: string): boolean {
  const config = getNotionConfig(userId);
  return config?.connected ?? false;
}

export function getOrCreateNote(
  userId: string,
  idempotencyKey: string,
  title: string
): CreatedNote {
  const userStore = getUserStore(userId);

  const existing = userStore.idempotencyMap.get(idempotencyKey);
  if (existing) {
    return existing;
  }

  const noteId = `note_${idempotencyKey.slice(0, 8)}_${String(Date.now())}`;
  const note: CreatedNote = {
    id: noteId,
    url: `https://notion.so/${noteId.replace(/_/g, '-')}`,
    title,
    createdAt: new Date().toISOString(),
  };

  userStore.idempotencyMap.set(idempotencyKey, note);
  return note;
}

/**
 * Clear all store data. Used for testing.
 */
export function clearStore(): void {
  store.clear();
}
