# Documentation Runs

Log of all `/document-service` runs.

---

<!-- Entries are prepended below this line -->

## 2026-01-19 — Agent Interface Documentation

**Action:** Created
**Agent:** service-scribe (autonomous)

**Mission:** Create machine-readable `agent.md` interface definitions for all 18 services, enabling AI-to-AI communication and automated tool discovery.

**Files Created (18 files):**

| Service | File | Tools Defined |
| ------- | ---- | ------------- |
| research-agent | `docs/services/research-agent/agent.md` | 4 (research, list, get, generateTitle) |
| actions-agent | `docs/services/actions-agent/agent.md` | 3 (routeAction, listActions, getActionStatus) |
| commands-agent | `docs/services/commands-agent/agent.md` | 1 (classifyCommand) |
| todos-agent | `docs/services/todos-agent/agent.md` | 6 (CRUD + complete/uncomplete) |
| bookmarks-agent | `docs/services/bookmarks-agent/agent.md` | 5 (CRUD + archive) |
| notes-agent | `docs/services/notes-agent/agent.md` | 5 (CRUD + archive) |
| calendar-agent | `docs/services/calendar-agent/agent.md` | 6 (CRUD + sync + freeBusy) |
| linear-agent | `docs/services/linear-agent/agent.md` | 4 (list, get, create, update) |
| image-service | `docs/services/image-service/agent.md` | 2 (generate, getStatus) |
| web-agent | `docs/services/web-agent/agent.md` | 2 (extractMetadata, summarize) |
| whatsapp-service | `docs/services/whatsapp-service/agent.md` | 6 (messages, media, transcription) |
| user-service | `docs/services/user-service/agent.md` | 8 (auth, OAuth, LLM keys, settings) |
| mobile-notifications-service | `docs/services/mobile-notifications-service/agent.md` | 6 (notifications + filters) |
| notion-service | `docs/services/notion-service/agent.md` | 3 (connect, status, disconnect) |
| promptvault-service | `docs/services/promptvault-service/agent.md` | 5 (CRUD + main page) |
| app-settings-service | `docs/services/app-settings-service/agent.md` | 2 (pricing, usageCosts) |
| api-docs-hub | `docs/services/api-docs-hub/agent.md` | 2 (docs, health) |
| data-insights-agent | `docs/services/data-insights-agent/agent.md` | 12 (sources, feeds, analysis, charts) |

**Files Updated:**

- `docs/services/index.md` — Added agent.md links to all 18 services, updated coverage metrics

**agent.md Structure:**

Each file follows a consistent machine-readable format:

```markdown
## Identity
| Field | Value |
| Name | service-name |
| Role | Service description |
| Goal | Primary purpose |

## Capabilities
### Tools (Endpoints)
TypeScript interface definitions for all public methods

### Types
TypeScript interfaces for request/response schemas

## Constraints
Rules and limitations for tool usage

## Usage Patterns
One-shot examples of correct tool invocations

## Internal Endpoints (if applicable)
Service-to-service communication endpoints
```

**Key Decisions:**

1. **TypeScript Interfaces** — Used strict TypeScript for tool definitions to enable type-safe LLM tool generation
2. **Constraints Section** — Documented rules like "Ownership: Users can only access their own data" for safety
3. **Usage Patterns** — Provided code examples showing correct invocation patterns
4. **Internal Endpoints** — Separated internal (service-to-service) from public APIs

**Documentation Coverage:** 100% (18/18 services with agent.md)

---

## 2026-01-19 — AI-First Documentation Overhaul

**Action:** Major Update
**Agent:** service-scribe (autonomous)

**Mission:** Comprehensive documentation refresh emphasizing AI capabilities across all services.

**Files Updated:**

### High-Level Documentation
- `README.md` — Complete rewrite with AI-first framing, architecture diagrams, "Council of AI" concept
- `docs/overview.md` — New platform overview with AI stack, agent architecture, data flow diagrams
- `docs/services/index.md` — Reorganized by AI capability, added model listings, dependency diagram
- `docs/architecture/ai-architecture.md` — **New file** — Comprehensive AI architecture documentation

**Key Changes:**

1. **README.md Highlights**
   - Added "Council of AI" parallel research visualization
   - Listed all 17 microservices with AI capabilities
   - Added provider integration table (5 providers, 15 models)
   - Engineering philosophy section

2. **Platform Overview**
   - Multi-Model Intelligence Layer documentation
   - Research Synthesis Protocol with sequence diagram
   - Capture-to-Action Pipeline visualization
   - Cost Intelligence section

3. **Services Index**
   - Services now categorized by AI capability
   - Added AI Models Used section with all 15 models
   - Service dependency mermaid diagram
   - Quick links by use case and integration

4. **AI Architecture (New)**
   - Council of AI philosophy documented
   - Provider integration architecture
   - Research synthesis protocol
   - Intent classification flow
   - Cost management and security

**AI Capabilities Documented:**

| Service | AI Capability |
| ------- | ------------- |
| research-agent | Multi-model orchestration (10 models) |
| commands-agent | Gemini intent classification |
| data-insights-agent | LLM data analysis |
| image-service | DALL-E 3, Imagen 3 |
| bookmarks-agent | AI summarization (via web-agent) |
| web-agent | Content extraction, summarization |
| todos-agent | NLP task extraction |
| whatsapp-service | Speechmatics transcription |
| user-service | LLM key validation |

**Models Documented:**
- Research: 10 models (Gemini, GPT-5.2, Claude Opus/Sonnet, Sonar variants, GLM-4.7)
- Classification: 2 models (Gemini Flash, GLM-4.7)
- Image: 2 models (DALL-E 3, Imagen 3)
- Validation: 5 models (Haiku, Flash, Mini, Sonar, GLM)

**Documentation Quality:**
- All diagrams use mermaid for GitHub rendering
- Tables properly aligned
- Active voice throughout
- Technical accuracy verified against source code

---

## 2026-01-14 — Comprehensive Service Documentation Update

**Action:** Updated
**Agent:** service-scribe (autonomous)

**Files Updated:**

- `docs/services/actions-agent/features.md` — Refreshed content
- `docs/services/actions-agent/technical.md` — Refreshed content
- `docs/services/actions-agent/technical-debt.md` — Updated date, added auto-execution TODO
- `docs/services/research-agent/features.md` — Added Zai provider limitations
- `docs/services/research-agent/technical.md` — Added Zai provider models
- `docs/services/app-settings-service/features.md` — Updated to 5 providers, added internal/public endpoint distinction
- `docs/services/app-settings-service/technical.md` — Comprehensive update with architecture diagram
- `docs/services/whatsapp-service/technical-debt.md` — Updated date
- `docs/site-index.json` — Updated research-agent to 5 providers, app-settings-service to 5 providers, updated date

**Inferred Insights:**

- Why: Services had evolved since last documentation (Zai provider added, app-settings-service now has internal endpoints)
- Killer feature: Multi-provider LLM support with cost transparency
- Future plans:
  - actions-agent: Auto-execution based on confidence (stub exists)
  - whatsapp-service: Refactor processWebhookEvent to accept raw payload
  - actions-agent: calendar/reminder handler implementations

**Documentation Coverage:** 100% (17/17 services)

**Technical Debt Found:**

- TODO comments: 1 (whatsapp-service: refactor processWebhookEvent)
- Code smells: 0
- Test gaps: 0
- Type issues: 0

**Changes Summary:**

- Added Zai (glm-4.7) to research-agent LLM providers
- Updated app-settings-service to reflect 5 LLM providers (was 4)
- Added internal endpoint documentation for app-settings-service
- Updated all documentation dates to 2026-01-14

---

## 2026-01-13 — Top-Level Documentation Update

**Action:** Updated index files following tutorial completion
**Agent:** service-scribe

**Files Updated:**

- `docs/services/index.md` — Added tutorial links for bookmarks-agent, notes-agent, todos-agent
- Updated documentation count to "17 / 17 (100%) — All with tutorials"

**Context:**

Previous session completed missing tutorial.md and technical-debt.md files for three services. This update synchronizes the services catalog index to reflect that all services now have complete documentation (features, technical, tutorial, debt).

**Changes from previous:**

- bookmarks-agent: Added `[tutorial](bookmarks-agent/tutorial.md)` link
- notes-agent: Added `[tutorial](notes-agent/tutorial.md)` link
- todos-agent: Added `[tutorial](todos-agent/tutorial.md)` link

---

## 2026-01-13 — Complete Service Documentation Run

**Action:** Created / Updated
**Agent:** service-scribe (autonomous)

**Files Created:**

### Service Documentation Files (68 files)

**actions-agent** (4 files)

- `docs/services/actions-agent/features.md`
- `docs/services/actions-agent/technical.md`
- `docs/services/actions-agent/tutorial.md`
- `docs/services/actions-agent/technical-debt.md`

**research-agent** (4 files)

- `docs/services/research-agent/features.md`
- `docs/services/research-agent/technical.md`
- `docs/services/research-agent/tutorial.md`
- `docs/services/research-agent/technical-debt.md`

**user-service** (4 files)

- `docs/services/user-service/features.md`
- `docs/services/user-service/technical.md`
- `docs/services/user-service/tutorial.md`
- `docs/services/user-service/technical-debt.md`

**image-service** (4 files)

- `docs/services/image-service/features.md`
- `docs/services/image-service/technical.md`
- `docs/services/image-service/tutorial.md`
- `docs/services/image-service/technical-debt.md`

**bookmarks-agent** (4 files)

- `docs/services/bookmarks-agent/features.md`
- `docs/services/bookmarks-agent/technical.md`
- `docs/services/bookmarks-agent/tutorial.md`
- `docs/services/bookmarks-agent/technical-debt.md`

**notes-agent** (4 files)

- `docs/services/notes-agent/features.md`
- `docs/services/notes-agent/technical.md`
- `docs/services/notes-agent/tutorial.md`
- `docs/services/notes-agent/technical-debt.md`

**todos-agent** (4 files)

- `docs/services/todos-agent/features.md`
- `docs/services/todos-agent/technical.md`
- `docs/services/todos-agent/tutorial.md`
- `docs/services/todos-agent/technical-debt.md`

**whatsapp-service** (4 files)

- `docs/services/whatsapp-service/features.md`
- `docs/services/whatsapp-service/technical.md`
- `docs/services/whatsapp-service/tutorial.md`
- `docs/services/whatsapp-service/technical-debt.md`

**commands-agent** (4 files)

- `docs/services/commands-agent/features.md`
- `docs/services/commands-agent/technical.md`
- `docs/services/commands-agent/tutorial.md`
- `docs/services/commands-agent/technical-debt.md`

**web-agent** (4 files)

- `docs/services/web-agent/features.md`
- `docs/services/web-agent/technical.md`
- `docs/services/web-agent/tutorial.md`
- `docs/services/web-agent/technical-debt.md`

**calendar-agent** (4 files)

- `docs/services/calendar-agent/features.md`
- `docs/services/calendar-agent/technical.md`
- `docs/services/calendar-agent/tutorial.md`
- `docs/services/calendar-agent/technical-debt.md`

**data-insights-agent** (4 files)

- `docs/services/data-insights-agent/features.md`
- `docs/services/data-insights-agent/technical.md`
- `docs/services/data-insights-agent/tutorial.md`
- `docs/services/data-insights-agent/technical-debt.md`

**mobile-notifications-service** (4 files)

- `docs/services/mobile-notifications-service/features.md`
- `docs/services/mobile-notifications-service/technical.md`
- `docs/services/mobile-notifications-service/tutorial.md`
- `docs/services/mobile-notifications-service/technical-debt.md`

**api-docs-hub** (4 files)

- `docs/services/api-docs-hub/features.md`
- `docs/services/api-docs-hub/technical.md`
- `docs/services/api-docs-hub/tutorial.md`
- `docs/services/api-docs-hub/technical-debt.md`

**app-settings-service** (4 files)

- `docs/services/app-settings-service/features.md`
- `docs/services/app-settings-service/technical.md`
- `docs/services/app-settings-service/tutorial.md`
- `docs/services/app-settings-service/technical-debt.md`

**notion-service** (4 files)

- `docs/services/notion-service/features.md`
- `docs/services/notion-service/technical.md`
- `docs/services/notion-service/tutorial.md`
- `docs/services/notion-service/technical-debt.md`

**promptvault-service** (4 files)

- `docs/services/promptvault-service/features.md`
- `docs/services/promptvault-service/technical.md`
- `docs/services/promptvault-service/tutorial.md`
- `docs/services/promptvault-service/technical-debt.md`

### Aggregated Content (3 files)

- `docs/services/index.md`
- `docs/site-index.json`
- `docs/overview.md`

**Inferred Insights:**

| Service                      | Why Exists                                       | Killer Feature                                       | Future Plans                           |
| ---------------------------- | ------------------------------------------------ | ---------------------------------------------------- | -------------------------------------- |
| actions-agent                | Central orchestration point for all user actions | Pub/Sub distribution to specialized agents           | Action type registry expansion         |
| research-agent               | Multi-LLM synthesis for comprehensive research   | Parallel queries across 4 providers with aggregation | More LLM providers, custom prompts     |
| user-service                 | Unified auth and API key management              | AES-256-GCM encryption for API keys                  | More OAuth providers                   |
| image-service                | AI image generation for research covers          | DALL-E 3 and Imagen 3 support                        | More image models                      |
| bookmarks-agent              | Save links with metadata extraction              | OpenGraph metadata via web-agent                     | Full-text search                       |
| notes-agent                  | Quick note capture                               | Simple CRUD with tag support                         | Rich text, versioning                  |
| todos-agent                  | Task management with AI extraction               | AI-powered item extraction from natural language     | Recurring tasks, sub-task dependencies |
| whatsapp-service             | WhatsApp Business integration                    | Media download to GCS with async transcription       | More message types                     |
| commands-agent               | Classify user intent into action types           | Model preference detection from natural language     | More action types                      |
| web-agent                    | OpenGraph metadata extraction                    | Streaming with 2MB limit enforcement                 | Twitter card expansion                 |
| calendar-agent               | Google Calendar integration                      | Free/busy queries across multiple calendars          | Recurring event support                |
| data-insights-agent          | AI-powered data analysis                         | Composite feeds combining multiple sources           | More chart types                       |
| mobile-notifications-service | Push notification gateway                        | Signature-based device authentication                | More platforms (iOS)                   |
| api-docs-hub                 | Unified API documentation                        | Multi-spec aggregation with service selector         | Live API testing                       |
| app-settings-service         | LLM pricing and usage tracking                   | Per-model cost analytics                             | More providers, budget alerts          |
| notion-service               | Notion integration management                    | Connection lifecycle with workspace detection        | Two-way sync                           |
| promptvault-service          | Prompt template management                       | Notion database sync for prompts                     | Version history, sharing               |

**Documentation Coverage:** 100%

**Technical Debt Summary:**

| Service                      | TODOs | Code Smells | Test Gaps | Type Issues |
| ---------------------------- | ----- | ----------- | --------- | ----------- |
| actions-agent                | 0     | 2           | 0         | 0           |
| research-agent               | 0     | 1           | 0         | 0           |
| user-service                 | 0     | 0           | 0         | 0           |
| image-service                | 0     | 1           | 0         | 0           |
| bookmarks-agent              | 0     | 1           | 0         | 0           |
| notes-agent                  | 0     | 1           | 0         | 0           |
| todos-agent                  | 0     | 0           | 0         | 0           |
| whatsapp-service             | 0     | 2           | 0         | 0           |
| commands-agent               | 0     | 0           | 0         | 0           |
| web-agent                    | 0     | 0           | 0         | 0           |
| calendar-agent               | 0     | 0           | 0         | 0           |
| data-insights-agent          | 0     | 0           | 0         | 0           |
| mobile-notifications-service | 0     | 0           | 0         | 0           |
| api-docs-hub                 | 0     | 0           | 0         | 0           |
| app-settings-service         | 0     | 0           | 0         | 0           |
| notion-service               | 0     | 0           | 0         | 0           |
| promptvault-service          | 0     | 0           | 0         | 0           |

**Total:** 8 code smells identified across 17 services (all low severity)

---
