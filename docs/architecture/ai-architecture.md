# AI Architecture

IntexuraOS is an AI-first platform that leverages multiple Large Language Models (LLMs) to create an intelligent, autonomous cognitive layer for personal productivity.

## AI Philosophy

### The Council of AI

Rather than relying on a single AI model, IntexuraOS employs a "Council of AI" approach for complex tasks:

1. **Parallel Querying**: Send the same research question to multiple models simultaneously
2. **Independent Verification**: Each model performs its own reasoning and web search
3. **Confidence Aggregation**: Synthesize responses with confidence scores
4. **Source Attribution**: Every claim is attributed to a specific model/source

This approach reduces hallucination risk and provides more comprehensive answers than any single model.

### Model Selection Strategy

| Task Type          | Primary Model        | Fallback Model    | Rationale                           |
| ------------------ | -------------------- | ----------------- | ----------------------------------- |
| Research Synthesis | Claude Opus 4.5      | GPT-5.2           | Nuanced reasoning, long context     |
| Quick Classification | Gemini 2.5 Flash   | GLM-4.7           | Fast, cost-effective                |
| Deep Research      | O4 Mini Deep Research | Sonar Deep Research | Agentic web search               |
| Fact Verification  | Perplexity Sonar     | Sonar Pro         | Real-time web grounding             |
| Image Generation   | DALL-E 3             | Gemini Imagen     | High quality, diverse styles        |

## Supported Models

### Research Models (10)

Models capable of complex reasoning, web search, and multi-step analysis.

| Model                    | Provider   | Strengths                                     |
| ------------------------ | ---------- | --------------------------------------------- |
| Gemini 2.5 Pro           | Google     | Long context (1M tokens), grounded search     |
| Gemini 2.5 Flash         | Google     | Fast, cost-effective, good reasoning          |
| GPT-5.2                  | OpenAI     | Latest OpenAI flagship, strong reasoning      |
| O4 Mini Deep Research    | OpenAI     | Agentic research with tool use                |
| Claude Opus 4.5          | Anthropic  | Best reasoning, nuanced analysis              |
| Claude Sonnet 4.5        | Anthropic  | Balanced performance/cost                     |
| Sonar                    | Perplexity | Real-time web search                          |
| Sonar Pro                | Perplexity | Enhanced web search with more sources         |
| Sonar Deep Research      | Perplexity | Multi-step agentic research                   |
| GLM-4.7                  | Zai        | Alternative provider, good multilingual       |

### Fast Models (2)

Optimized for quick, low-cost operations like classification and extraction.

| Model                | Provider | Use Cases                                    |
| -------------------- | -------- | -------------------------------------------- |
| Gemini 2.5 Flash     | Google   | Intent classification, title generation      |
| Gemini 2.0 Flash     | Google   | API key validation, quick inference          |

### Image Models (2)

Text-to-image generation for cover images and visualizations.

| Model                    | Provider | Capabilities                               |
| ------------------------ | -------- | ------------------------------------------ |
| GPT Image 1 (DALL-E 3)   | OpenAI   | Photorealistic, artistic styles            |
| Gemini 2.5 Flash Image   | Google   | Fast image generation, consistent style    |

### Validation Models (5)

Cheap, fast models for API key validation and simple tasks.

| Model              | Provider   | Token Cost       |
| ------------------ | ---------- | ---------------- |
| Claude Haiku 3.5   | Anthropic  | $0.80/M input    |
| Gemini 2.0 Flash   | Google     | $0.075/M input   |
| GPT-4o Mini        | OpenAI     | $0.15/M input    |
| Sonar              | Perplexity | $1.00/M input    |
| GLM-4.7            | Zai        | Varies           |

## AI Pipeline Architecture

```mermaid
graph TB
    subgraph "Input Layer"
        WA[WhatsApp Voice]
        WEB[Web Interface]
        API[Direct API]
    end

    subgraph "Transcription"
        SM[Speechmatics]
    end

    subgraph "Classification Layer"
        CMD[Commands Agent]
        GEM1[Gemini 2.5 Flash]
        GLM1[GLM-4.7]
    end

    subgraph "Action Router"
        AA[Actions Agent]
    end

    subgraph "AI Agents"
        RA[Research Agent]
        TA[Todos Agent]
        CA[Calendar Agent]
        LA[Linear Agent]
        DIA[Data Insights Agent]
        IS[Image Service]
    end

    subgraph "Research Council"
        CLAUDE[Claude Opus 4.5]
        GPT[GPT-5.2]
        GEM2[Gemini 2.5 Pro]
        SONAR[Perplexity Sonar]
        O4[O4 Mini Deep Research]
    end

    subgraph "Synthesis"
        SYN[Synthesizer]
    end

    WA -->|Audio| SM
    SM -->|Text| CMD
    WEB --> CMD
    API --> CMD

    CMD --> GEM1
    CMD --> GLM1
    GEM1 --> AA
    GLM1 --> AA

    AA --> RA
    AA --> TA
    AA --> CA
    AA --> LA
    AA --> DIA
    AA --> IS

    RA --> CLAUDE
    RA --> GPT
    RA --> GEM2
    RA --> SONAR
    RA --> O4

    CLAUDE --> SYN
    GPT --> SYN
    GEM2 --> SYN
    SONAR --> SYN
    O4 --> SYN
```

## Agent AI Capabilities

### Commands Agent

**Purpose**: Classify user intent from natural language

**AI Models**: Gemini 2.5 Flash, GLM-4.7

**Process**:
1. Receive transcribed text or typed input
2. Use structured output (JSON mode) for classification
3. Detect action type: research, todo, note, link, calendar, linear
4. Detect model preferences from explicit mentions ("use Claude", "ask GPT")

### Research Agent

**Purpose**: Deep research with multi-model synthesis

**AI Models**: All 10 research models

**Process**:
1. **Validation**: Check if query is a valid research question
2. **Context Inference**: Detect implicit context and constraints
3. **Parallel Research**: Query 3-5 models simultaneously
4. **Synthesis**: Aggregate findings with confidence scores
5. **Title Generation**: Create descriptive title
6. **Cover Image**: Generate visual representation

### Todos Agent

**Purpose**: Extract task items from natural language

**AI Models**: Gemini 2.5 Flash, GLM-4.7

**Extraction Capabilities**:
- Task title from description
- Due dates from relative expressions ("by Friday", "next week")
- Priority from context ("urgent", "when you have time")
- Sub-items from compound tasks

### Calendar Agent

**Purpose**: Parse calendar events from voice descriptions

**AI Models**: Gemini 2.5 Flash

**Extraction Capabilities**:
- Event title
- Start/end times from natural expressions
- Location
- Attendees
- Recurrence patterns

### Linear Agent

**Purpose**: Create Linear issues from natural language

**AI Models**: Gemini 2.5 Flash, GLM-4.7

**Extraction Capabilities**:
- Issue title
- Priority (0-4 scale)
- Functional requirements section
- Technical details section

### Data Insights Agent

**Purpose**: AI-powered data analysis

**AI Models**: Gemini (multiple services)

**Capabilities**:
- **Title Generation**: Descriptive names for datasets
- **Data Analysis**: Trend detection, anomaly identification
- **Chart Definition**: Suggest appropriate visualizations
- **Data Transform**: Clean and reshape data

### Image Service

**Purpose**: Generate images from text prompts

**AI Models**: DALL-E 3, Gemini Imagen

**Capabilities**:
- Cover images for research reports
- Custom thumbnails
- Artistic style variations
- Photorealistic rendering

## LLM Infrastructure

### Unified Client Factory

All LLM interactions go through `@intexuraos/llm-factory`:

```typescript
import { createLlmClient } from '@intexuraos/llm-factory';

const client = createLlmClient({
  provider: 'anthropic',
  model: 'claude-opus-4-5-20251101',
  apiKey: userApiKey,
});

const result = await client.generate({
  prompt: 'Analyze the following...',
  maxTokens: 4000,
});
```

### Provider Packages

| Package                  | Provider   | Capabilities                          |
| ------------------------ | ---------- | ------------------------------------- |
| `@intexuraos/infra-claude` | Anthropic  | Chat, streaming, tool use             |
| `@intexuraos/infra-gemini` | Google     | Chat, grounding, image generation     |
| `@intexuraos/infra-gpt`    | OpenAI     | Chat, DALL-E, embeddings              |
| `@intexuraos/infra-perplexity` | Perplexity | Web search, deep research         |
| `@intexuraos/infra-glm`    | Zai        | Chat, structured output               |

### Usage Tracking

All LLM calls are tracked through the `llm-audit` package:

- Token usage (input/output)
- Cost calculation
- Model selection
- Response latency
- Error rates

Published to Pub/Sub for aggregation in `app-settings-service`.

## Prompt Engineering

### Structured Output

All extraction tasks use JSON mode or structured schemas:

```typescript
const extractionSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', maxLength: 100 },
    priority: { type: 'integer', minimum: 0, maximum: 4 },
    valid: { type: 'boolean' },
    reasoning: { type: 'string' },
  },
  required: ['title', 'priority', 'valid', 'reasoning'],
};
```

### Few-Shot Examples

Classification prompts include examples for each action type:

```
User: "What's the best approach to microservice architecture?"
Classification: { type: "research", confidence: 0.95 }

User: "Remind me to call mom tomorrow"
Classification: { type: "todo", confidence: 0.98 }
```

### Chain-of-Thought

Research synthesis uses explicit reasoning steps:

1. Summarize each model's response
2. Identify areas of agreement
3. Note contradictions with sources
4. Calculate confidence per claim
5. Generate final synthesized answer

## Cost Optimization

### Model Tiering

| Tier      | Use Case                  | Cost/1M Tokens | Example Models        |
| --------- | ------------------------- | -------------- | --------------------- |
| Premium   | Deep research, synthesis  | $15-75         | Claude Opus, GPT-5.2  |
| Standard  | General queries           | $3-10          | Claude Sonnet, Gemini Pro |
| Economy   | Classification, extraction| $0.08-1        | Gemini Flash, Haiku   |

### Caching Strategy

- **Prompt Caching**: Reuse system prompts across requests
- **Result Caching**: Cache deterministic outputs (title generation)
- **Context Caching**: Preserve conversation context for follow-ups

### Batch Processing

- Research queries are parallelized, not sequential
- Failed extractions are batched for retry
- Usage aggregation is async via Pub/Sub

## Security

### API Key Management

- User API keys stored encrypted (AES-256-GCM) in Firestore
- Keys decrypted only when making LLM calls
- No plaintext keys in logs or responses

### Rate Limiting

- Per-user rate limits for LLM calls
- Provider-level quotas respected
- Graceful degradation when limits hit

### Content Filtering

- Input validation before LLM calls
- Output sanitization for user display
- PII detection in research outputs
