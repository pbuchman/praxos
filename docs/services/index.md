# Services Catalog

Complete documentation for all IntexuraOS services. Each service is a specialized AI agent or infrastructure component in the autonomous cognitive platform.

## AI-Powered Services at a Glance

IntexuraOS leverages **15 LLM models** across **5 AI providers** to power its intelligent agents:

| Provider   | Models                                                      | Use Cases                            |
| ---------- | ----------------------------------------------------------- | ------------------------------------ |
| Google     | Gemini 2.5 Pro, Gemini 2.5 Flash, Gemini 2.0 Flash, Imagen  | Research, Classification, Images     |
| OpenAI     | GPT-5.2, GPT-4o Mini, O4 Mini Deep Research, DALL-E 3       | Research, Synthesis, Images          |
| Anthropic  | Claude Opus 4.5, Claude Sonnet 4.5, Claude Haiku 3.5        | Research, Analysis                   |
| Perplexity | Sonar, Sonar Pro, Sonar Deep Research                       | Web Search, Fact Verification        |
| Zai        | GLM-4.7                                                     | Classification, Extraction           |

## Documented Services

| Service                                                                  | Purpose                                  | AI/Agent                     | Documentation |
| ------------------------------------------------------------------------ | ---------------------------------------- | ---------------------------- | ------------- |
| [actions-agent](actions-agent/features.md)                               | Central action lifecycle orchestration   | Action Router                | [features](actions-agent/features.md) [technical](actions-agent/technical.md) [debt](actions-agent/technical-debt.md) |
| [research-agent](research-agent/features.md)                             | Multi-LLM research synthesis             | 10 Research Models           | [features](research-agent/features.md) [technical](research-agent/technical.md) [debt](research-agent/technical-debt.md) |
| [commands-agent](commands-agent/features.md)                             | Intent classification from natural lang  | Gemini 2.5 Flash, GLM-4.7    | [features](commands-agent/features.md) [technical](commands-agent/technical.md) [debt](commands-agent/technical-debt.md) |
| [data-insights-agent](data-insights-agent/features.md)                   | AI-powered data analysis & visualization | Gemini (Analysis, Charts)    | [features](data-insights-agent/features.md) [technical](data-insights-agent/technical.md) [debt](data-insights-agent/technical-debt.md) |
| [todos-agent](todos-agent/features.md)                                   | Task management with AI item extraction  | Gemini 2.5 Flash, GLM-4.7    | [features](todos-agent/features.md) [technical](todos-agent/technical.md) [debt](todos-agent/technical-debt.md) |
| [calendar-agent](calendar-agent/features.md)                             | Google Calendar with AI event extraction | Gemini (Event Parsing)       | [features](calendar-agent/features.md) [technical](calendar-agent/technical.md) [debt](calendar-agent/technical-debt.md) |
| [linear-agent](linear-agent/features.md)                                 | Linear issue creation from natural lang  | Gemini 2.5 Flash, GLM-4.7    | [features](linear-agent/features.md) [technical](linear-agent/technical.md) [debt](linear-agent/technical-debt.md) |
| [image-service](image-service/features.md)                               | AI image generation                      | DALL-E 3, Gemini Imagen      | [features](image-service/features.md) [technical](image-service/technical.md) [debt](image-service/technical-debt.md) |
| [bookmarks-agent](bookmarks-agent/features.md)                           | Link management with AI summaries        | Crawl4AI (Summarization)     | [features](bookmarks-agent/features.md) [technical](bookmarks-agent/technical.md) [debt](bookmarks-agent/technical-debt.md) |
| [web-agent](web-agent/features.md)                                       | Web scraping & page summarization        | Crawl4AI                     | [features](web-agent/features.md) [technical](web-agent/technical.md) [debt](web-agent/technical-debt.md) |
| [notes-agent](notes-agent/features.md)                                   | Note-taking                              | -                            | [features](notes-agent/features.md) [technical](notes-agent/technical.md) [debt](notes-agent/technical-debt.md) |
| [whatsapp-service](whatsapp-service/features.md)                         | WhatsApp Business integration            | Speechmatics (Transcription) | [features](whatsapp-service/features.md) [technical](whatsapp-service/technical.md) [debt](whatsapp-service/technical-debt.md) |
| [user-service](user-service/features.md)                                 | Authentication, settings, API keys       | -                            | [features](user-service/features.md) [technical](user-service/technical.md) [debt](user-service/technical-debt.md) |
| [mobile-notifications-service](mobile-notifications-service/features.md) | Push notification gateway                | -                            | [features](mobile-notifications-service/features.md) [technical](mobile-notifications-service/technical.md) [debt](mobile-notifications-service/technical-debt.md) |
| [api-docs-hub](api-docs-hub/features.md)                                 | OpenAPI documentation aggregator         | -                            | [features](api-docs-hub/features.md) [technical](api-docs-hub/technical.md) [debt](api-docs-hub/technical-debt.md) |
| [app-settings-service](app-settings-service/features.md)                 | LLM pricing and usage analytics          | -                            | [features](app-settings-service/features.md) [technical](app-settings-service/technical.md) [debt](app-settings-service/technical-debt.md) |
| [notion-service](notion-service/features.md)                             | Notion integration management            | -                            | [features](notion-service/features.md) [technical](notion-service/technical.md) [debt](notion-service/technical-debt.md) |
| [promptvault-service](promptvault-service/features.md)                   | Prompt template management               | -                            | [features](promptvault-service/features.md) [technical](promptvault-service/technical.md) [debt](promptvault-service/technical-debt.md) |

## Service Categories

### AI & Research Agents

Services that leverage LLMs to process, analyze, and synthesize information.

| Service                                                  | AI Capability                                  |
| -------------------------------------------------------- | ---------------------------------------------- |
| [research-agent](research-agent/features.md)             | Parallel queries to 10 LLMs with synthesis    |
| [commands-agent](commands-agent/features.md)             | Intent classification (research/todo/note/link)|
| [data-insights-agent](data-insights-agent/features.md)   | Data analysis, chart generation, trend detection|
| [todos-agent](todos-agent/features.md)                   | Extract task items from natural language       |
| [calendar-agent](calendar-agent/features.md)             | Parse event details from voice descriptions    |
| [linear-agent](linear-agent/features.md)                 | Extract issue title/priority/description       |
| [image-service](image-service/features.md)               | Generate images from text prompts              |

### Content Management Agents

Services that store and organize user content.

- [bookmarks-agent](bookmarks-agent/features.md) - Link saving with AI-generated summaries
- [notes-agent](notes-agent/features.md) - Simple note-taking with tags
- [promptvault-service](promptvault-service/features.md) - Prompt templates synced from Notion

### Integration Services

Services that connect IntexuraOS to external platforms.

- [whatsapp-service](whatsapp-service/features.md) - WhatsApp Business API with voice transcription
- [calendar-agent](calendar-agent/features.md) - Google Calendar CRUD operations
- [linear-agent](linear-agent/features.md) - Linear project management integration
- [notion-service](notion-service/features.md) - Notion database connectivity
- [user-service](user-service/features.md) - Auth0 authentication & API key management

### Infrastructure Services

Platform services that support the agent ecosystem.

- [actions-agent](actions-agent/features.md) - Central action orchestration and routing
- [web-agent](web-agent/features.md) - Web scraping and OpenGraph metadata
- [mobile-notifications-service](mobile-notifications-service/features.md) - Push notification delivery
- [api-docs-hub](api-docs-hub/features.md) - Unified API documentation
- [app-settings-service](app-settings-service/features.md) - LLM pricing and configuration

## Documentation Coverage

All **18 services** have complete documentation:

- **features.md** - Value propositions and use cases
- **technical.md** - Developer reference with API endpoints
- **technical-debt.md** - Debt tracking and future plans
- **agent.md** - Machine-readable interface (select services)

## Documentation Date

**Last updated:** 2026-01-19

**Services documented:** 18 / 18 (100%)
