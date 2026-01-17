# INT-132: PWA Shared Data Handling Investigation

## Summary

This document describes how data shared via the PWA application is processed, stored, and synchronized with the backend.

## PWA Share Target Configuration

The PWA manifest (`vite.config.ts`) defines a Web Share Target API configuration:

```json
{
  "share_target": {
    "action": "/share-target",
    "method": "GET",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url"
    }
  }
}
```

When a user shares content (link, text, or both) from any app on their device to IntexuraOS PWA, the browser opens the PWA at `/share-target?title=...&text=...&url=...`.

## Data Flow Architecture

### 1. Share Target Redirect (App.tsx)

When the PWA receives shared content, an immediate-invoked function handles the URL redirect:

```
Browser Share → /?title=X&text=Y&url=Z
            → Redirect to /#/share-target?title=X&text=Y&url=Z
```

This redirect converts the query params to hash-based routing (required for Cloud Storage static hosting without server-side routing).

### 2. ShareTargetPage Component

The `ShareTargetPage` component:
1. Extracts `title`, `text`, and `url` from URL search params
2. Combines them into a single text content (avoiding URL duplication)
3. Displays an editable textarea for user review
4. On "Save" click, calls `addShare(content)` from the SyncQueueContext

### 3. Share Queue (localStorage Persistence)

**Storage Mechanism:** `localStorage` (NOT sessionStorage or browser storage API)

Two localStorage keys are used:

| Key                        | Purpose                         | Max Items |
| -------------------------- | ------------------------------- | --------- |
| `intexuraos_share_queue`   | Pending items to sync           | Unlimited |
| `intexuraos_share_history` | History for display (all items) | 50        |

When content is shared:
1. A `ShareQueueItem` is created with unique ID, content, source (`pwa-shared`), timestamp
2. Item is added to both queue and history in localStorage
3. Background sync process is triggered

### 4. SyncQueueContext (Background Sync)

The `SyncQueueContext` provides:
- **Optimistic saving**: Content is saved to localStorage immediately (no network wait)
- **Background sync**: Every 5 seconds, pending items are synced to backend
- **Retry logic**: Exponential backoff (1s initial, max 1024s) for failed syncs
- **Online detection**: Sync triggered when device comes online

Processing flow:
```
localStorage Queue → For each due item:
  1. Mark as "syncing" in history
  2. Call createCommand(token, { text, source: "pwa-shared" })
  3. On success: Remove from queue, mark history as "synced"
  4. On 4xx error: Mark as "failed" (client error, don't retry)
  5. On 5xx/network error: Increment retry, schedule next attempt
```

### 5. Backend Processing

The `POST /commands` endpoint in `commands-agent`:
1. Creates a command record with `sourceType: "pwa-shared"`
2. Triggers command classification (todo, research, note, link, etc.)
3. Routes to appropriate agent (bookmarks-agent, notes-agent, etc.)

## Storage Summary

| Storage Type   | Used?    | What's Stored                        |
| -------------- | -------- | ------------------------------------ |
| localStorage   | **Yes**  | Share queue + history                |
| sessionStorage | No       | -                                    |
| IndexedDB      | No       | -                                    |
| Service Worker | Indirect | PWA caching only, not share data     |

**Data is stored temporarily** in localStorage until successfully synced. After sync:
- Queue item is removed
- History item is updated with `status: "synced"` and `commandId`

**Data is NOT just processed directly.** The optimistic save pattern ensures:
1. Offline support (content saved even without network)
2. Instant UI feedback (no loading spinners on save)
3. Retry resilience (transient failures don't lose data)

## Share History Display

The `ShareHistoryPage` (`/settings/share-history`) displays:
- All shared items from localStorage history
- Status badges: Pending (yellow), Syncing (blue animated), Synced (green), Failed (red)
- Relative timestamps
- Error messages for failed items
- Clear history button

## "Short Links Key Store" Clarification

Based on code analysis, there is **no "short link key store"** in the traditional sense. However, related concepts exist:

### 1. Shared Research Reports (Public URLs)
- Research reports can be made public via `/share/{researchId}` URLs
- Files stored in `gs://intexuraos-shared-content-{env}/` bucket
- This creates "short links" in the form of `https://intexuraos.link/share/{uuid}`

### 2. Share History (What's Already Available)
- The Share History page already displays all shared content
- Accessible at `/settings/share-history` in PWA
- Shows pending, synced, and failed shares

### 3. Bookmarks (Link Storage)
- When shared content is classified as a `link`, it becomes a Bookmark
- Bookmarks are stored in Firestore, not in a "key store"
- Viewable at `/my-bookmarks`

### Feasibility: Displaying Link Store via PWA

If the request is about displaying **research public share links**:
- **Feasible**: Add a route to list all shared research with their public URLs
- **Location**: Could be under `/settings/share-history` or separate `/shared-research`
- **Backend**: Would need a `GET /research?shared=true` filter or similar

If the request is about displaying **bookmarks saved from shares**:
- **Already exists**: Use `/my-bookmarks` to see all saved links
- The `sourceType: "pwa-shared"` field identifies which came from PWA shares

## Key Files Reference

| File                                     | Purpose                              |
| ---------------------------------------- | ------------------------------------ |
| `apps/web/vite.config.ts`                | PWA manifest with share_target       |
| `apps/web/src/App.tsx`                   | Share redirect handler + routing     |
| `apps/web/src/pages/ShareTargetPage.tsx` | Share content review UI              |
| `apps/web/src/pages/ShareHistoryPage.tsx`| Share history display                |
| `apps/web/src/services/shareQueue.ts`    | localStorage queue/history functions |
| `apps/web/src/context/SyncQueueContext.tsx` | Background sync logic             |
| `apps/commands-agent/src/routes/commandsRoutes.ts` | POST /commands endpoint     |

## Conclusion

1. **Shared data is stored in localStorage** (temporarily) until synced to backend
2. **Optimistic saving pattern** ensures offline support and instant feedback
3. **Share History page already exists** at `/settings/share-history`
4. **No dedicated "short link key store"** - bookmarks serve this purpose
5. **Public research shares** create sharable URLs but aren't displayed in a dedicated view yet
