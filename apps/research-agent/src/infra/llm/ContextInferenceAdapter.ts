/**
 * Context inference adapter using Gemini Flash for fast context extraction.
 * Usage logging is handled by the client (packages/infra-gemini).
 */

import { createGeminiClient, type GeminiClient } from '@intexuraos/infra-gemini';
import type { ModelPricing } from '@intexuraos/llm-contract';
import {
  buildInferResearchContextPrompt,
  buildInferSynthesisContextPrompt,
  createDetailedParseErrorMessage,
  isResearchContext,
  isSynthesisContext,
  type InferResearchContextOptions,
  type InferSynthesisContextParams,
} from '@intexuraos/llm-common';
import { getErrorMessage, type Result } from '@intexuraos/common-core';
import type { LlmError } from '../../domain/research/ports/llmProvider.js';
import type {
  ContextInferenceProvider,
  ResearchContextResult,
  SynthesisContextResult,
} from '../../domain/research/ports/contextInference.js';
import type { Logger } from '@intexuraos/common-core';

/**
 * Expected schema for research context response.
 * Used for error messages to help debug LLM output issues.
 */
const RESEARCH_CONTEXT_SCHEMA = `ResearchContext with fields:
- language: string
- domain: Domain enum
- mode: Mode enum
- intent_summary: string
- defaults_applied: DefaultApplied[]
- assumptions: string[]
- answer_style: AnswerStyle[]
- time_scope: TimeScope
- locale_scope: LocaleScope
- research_plan: ResearchPlan
- output_format: OutputFormat
- safety: SafetyInfo
- red_flags: string[]`;

/**
 * Expected schema for synthesis context response.
 * Used for error messages to help debug LLM output issues.
 */
const SYNTHESIS_CONTEXT_SCHEMA = `SynthesisContext with fields:
- language: string
- domain: Domain enum
- mode: Mode enum
- synthesis_goals: SynthesisGoal[]
- missing_sections: string[]
- detected_conflicts: DetectedConflict[]
- source_preference: SourcePreference
- defaults_applied: DefaultApplied[]
- assumptions: string[]
- output_format: SynthesisOutputFormat
- safety: SafetyInfo
- red_flags: string[]`;

export class ContextInferenceAdapter implements ContextInferenceProvider {
  private readonly client: GeminiClient;
  private readonly logger: Logger | undefined;

  constructor(
    apiKey: string,
    model: string,
    userId: string,
    pricing: ModelPricing,
    logger?: Logger
  ) {
    this.client = createGeminiClient({ apiKey, model, userId, pricing });
    this.logger = logger;
  }

  async inferResearchContext(
    userQuery: string,
    opts?: InferResearchContextOptions
  ): Promise<Result<ResearchContextResult, LlmError>> {
    const prompt = buildInferResearchContextPrompt(userQuery, opts);
    const result = await this.client.generate(prompt);

    if (!result.ok) {
      return { ok: false, error: mapToLlmError(result.error) };
    }

    const parsed = parseJson(
      result.value.content,
      isResearchContext,
      'inferResearchContext',
      RESEARCH_CONTEXT_SCHEMA,
      this.logger
    );
    if (!parsed.ok) {
      return {
        ok: false,
        error: {
          code: 'API_ERROR',
          message: parsed.error,
          usage: {
            inputTokens: result.value.usage.inputTokens,
            outputTokens: result.value.usage.outputTokens,
            costUsd: result.value.usage.costUsd,
          },
        },
      };
    }

    const { usage } = result.value;
    return {
      ok: true,
      value: {
        context: parsed.value,
        usage: {
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          costUsd: usage.costUsd,
        },
      },
    };
  }

  async inferSynthesisContext(
    params: InferSynthesisContextParams
  ): Promise<Result<SynthesisContextResult, LlmError>> {
    const prompt = buildInferSynthesisContextPrompt(params);
    const result = await this.client.generate(prompt);

    if (!result.ok) {
      return { ok: false, error: mapToLlmError(result.error) };
    }

    const parsed = parseJson(
      result.value.content,
      isSynthesisContext,
      'inferSynthesisContext',
      SYNTHESIS_CONTEXT_SCHEMA,
      this.logger
    );
    if (!parsed.ok) {
      return {
        ok: false,
        error: {
          code: 'API_ERROR',
          message: parsed.error,
          usage: {
            inputTokens: result.value.usage.inputTokens,
            outputTokens: result.value.usage.outputTokens,
            costUsd: result.value.usage.costUsd,
          },
        },
      };
    }

    const { usage } = result.value;
    return {
      ok: true,
      value: {
        context: parsed.value,
        usage: {
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          costUsd: usage.costUsd,
        },
      },
    };
  }
}

function mapToLlmError(error: { code: string; message: string }): LlmError {
  const validCodes = ['API_ERROR', 'TIMEOUT', 'INVALID_KEY', 'RATE_LIMITED'] as const;
  const code = validCodes.includes(error.code as (typeof validCodes)[number])
    ? (error.code as LlmError['code'])
    : 'API_ERROR';

  return { code, message: error.message };
}

function parseJson<T>(
  raw: string,
  guard: (v: unknown) => v is T,
  operation: string,
  expectedSchema: string,
  logger?: Logger
): { ok: true; value: T } | { ok: false; error: string } {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    const errorDetails = createDetailedParseErrorMessage({
      errorMessage: `JSON parse error: ${getErrorMessage(e)}`,
      llmResponse: raw,
      expectedSchema,
      operation,
    });
    logger?.warn(
      {
        operation,
        errorMessage: getErrorMessage(e),
        llmResponse: raw.slice(0, 1000),
        responseLength: raw.length,
      },
      `LLM parse error in ${operation}: JSON parse failed`
    );
    return { ok: false, error: errorDetails };
  }

  if (!guard(parsed)) {
    const errorDetails = createDetailedParseErrorMessage({
      errorMessage: 'Response does not match expected schema',
      llmResponse: raw,
      expectedSchema,
      operation,
    });
    logger?.warn(
      {
        operation,
        errorMessage: 'Schema validation failed',
        llmResponse: raw.slice(0, 1000),
        expectedSchema,
        responseLength: raw.length,
        parsedJson: JSON.stringify(parsed).slice(0, 500),
      },
      `LLM parse error in ${operation}: Schema validation failed`
    );
    return { ok: false, error: errorDetails };
  }

  return { ok: true, value: parsed };
}
