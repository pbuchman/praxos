# Intex Agent

Intex Agent powers WhatsApp text conversations. It keeps a per-user session open, routes supported messages through a bounded tool policy, and returns a clear WhatsApp reply to the user.

## What It Can Do

- Create notes from text messages.
- Create Google Calendar events after resolving missing details and confirming the proposed event.
- Update event details and add or remove attendees, including several identified events under one confirmation.
- List existing Google Calendar events for bounded date questions such as next week.
- Count matching Google Calendar events for bounded date questions such as last month.
- Create research drafts for multi-model review.
- Save links as bookmarks.
- Create code tasks, defaulting to planning mode.
- Save images, pasted text, and explicitly shared links to an external processing/storage endpoint.

## Recent Changes

Since v3.8.0, Intex adds explicit WhatsApp confirmation for mutations, calendar list/count queries and confirmed updates, External Save, and versioned personal preferences. Today and tomorrow queries use deterministic date boundaries. Intex settings expose model selection when available for the user.

Preferences can be read, added, edited, and removed as individual instructions, with immutable versions for inspection. They guide responses but cannot override the action policy.

## Operator Testing

Local and dev operators can run backend conversation checks through
`POST /internal/intex-agent/test/conversation`. The endpoint uses internal auth,
captures assistant replies instead of publishing WhatsApp messages, persists
test-namespaced sessions/events for inspection, and replaces downstream tools
with bounded mocks.

The endpoint is for `test-intex-agent-<runId>` users only and is disabled in
production. The `userId` must exactly equal `test-intex-agent-<runId>`.

Operator Test Runs provide gated views of run and scenario evidence. Matrix corpus evaluations exercise transport and conversation behavior with strict mocked action tools; these checks do not perform real downstream product mutations.

## WhatsApp Session Continuity

After a reply, the session returns to `waiting_for_user` instead of closing. Follow-up messages reuse the same session until the user starts a new session or the configured timeout expires. The session transcript includes prior user messages, assistant replies, clarification requests, and completed tool summaries.

Users can start fresh with `/new`, `new session`, `start new session`, `start over`, or `forget this and start over`.

## Intent Gate

Intex Agent classifies supported creation, update, calendar-query, and preference requests before exposing tools. Calendar updates first identify the target events and require confirmation; unrelated multi-resource actions remain unsupported. Bare `http://` and `https://` URL shares are the exception and route to bookmark creation. Messages that say "save externally", "upload externally", "save for processing", "zapisz zewnętrznie", "prześlij zewnętrznie", or "zapisz do przetworzenia" route to external save instead. Read-only calendar list/count questions route only through `query_calendar_events`; apart from explicit preference reads, other read-only personal-data requests return an unsupported reply instead of being converted into another action.

## External Save

External Save is configured in Intex settings. The user needs an endpoint URL, Cloudflare Access Client ID, Cloudflare Access Client Secret, and source label. The default source label is `ios-shortcuts`.

When enabled, WhatsApp image messages prepare an External Save action for confirmation. If the image has a caption, the caption is sent as `message`; otherwise Intex sends `Image shared via WhatsApp.`. Shared links with external-save intent are passed as `source_url` without fetching or inspecting the URL.

## Current Limits

Direct voice-to-action execution is not supported. WhatsApp stores and transcribes audio separately; a text reply to completed audio may supply the transcript as context for an Intex request. General-purpose approval workflows, arbitrary reminders, standalone project-tracker issue creation, and broad assistant actions are also outside the current Intex tool boundary.
