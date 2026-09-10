# Code Agent Reference

Code Agent owns autonomous code task creation, task lifecycle state, GitHub automation, Linear synchronization, worker dispatch, and task logs.

## Supported Task Submission

- Public web/API task creation routes.
- Internal direct task creation from Intex Agent and other trusted services through `POST /internal/code/submit`.
- GitHub PR comments and webhook-driven follow-up tasks.
- Linear assignment-triggered task creation.

The retired action-status callback path is gone. Code Agent no longer mirrors task state to a separate action resource.

## Release Integration Boundaries

- SentryBox alerts enter through `POST /webhooks/sentry` with signature validation and durable deduplication. Reuse the returned task relationship when remediation is already active.
- Dispatch and review ownership are durable: do not bypass queue claims, attempt fencing, or PR review reservations.
- Ask Agent selects `codex`. Messages can resume planning tasks; review and remediation task types reject interactive messages.
- Treat persisted lifecycle and merge-ready evidence as the source for task-group state.

## Key Boundaries

- Code tasks default to planning mode unless execution mode is explicitly requested.
- Design review before implementation remains a quality gate.
- Documentation-only non-plan PRs request `documentation` review; plan-only PRs request `plan_review`.
- Worker dispatch stays HMAC-signed and container isolated.
- Internal endpoints must call `logIncomingRequest()` before auth validation.
