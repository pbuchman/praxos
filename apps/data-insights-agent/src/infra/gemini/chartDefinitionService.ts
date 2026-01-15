/**
 * Chart definition service using LLM client.
 * Generates chart configuration for a specific data insight using user's LLM client.
 */

import type { Result, Logger } from '@intexuraos/common-core';
import { err, getErrorMessage, ok } from '@intexuraos/common-core';
import {
  createDetailedParseErrorMessage,
  chartDefinitionPrompt,
  parseChartDefinition,
  type ParsedChartDefinition,
} from '@intexuraos/llm-common';
import type { UserServiceClient } from '../user/userServiceClient.js';

/**
 * Error from chart definition operations.
 */
export interface ChartDefinitionError {
  code: 'NO_API_KEY' | 'GENERATION_ERROR' | 'USER_SERVICE_ERROR' | 'PARSE_ERROR';
  message: string;
}

/**
 * Expected schema for chart definition response.
 */
const CHART_DEFINITION_SCHEMA = `CHART_CONFIG_START
{...json vega-lite config...}
CHART_CONFIG_END

TRANSFORM_INSTRUCTIONS_START
...instructions...
TRANSFORM_INSTRUCTIONS_END

Requirements:
- Chart config must be valid JSON
- Chart config must include $schema and mark properties
- Chart config must NOT include data property
- Transform instructions must not be empty`;

/**
 * Chart definition service interface.
 */
export interface ChartDefinitionService {
  generateChartDefinition(
    userId: string,
    jsonSchema: object,
    snapshotData: object,
    targetChartSchema: object,
    insight: {
      title: string;
      description: string;
      trackableMetric: string;
      suggestedChartType: string;
    }
  ): Promise<Result<ParsedChartDefinition, ChartDefinitionError>>;
}

/**
 * Create a chart definition service.
 */
export function createChartDefinitionService(
  userServiceClient: UserServiceClient,
  logger?: Logger
): ChartDefinitionService {
  return {
    async generateChartDefinition(
      userId: string,
      jsonSchema: object,
      snapshotData: object,
      targetChartSchema: object,
      insight: {
        title: string;
        description: string;
        trackableMetric: string;
        suggestedChartType: string;
      }
    ): Promise<Result<ParsedChartDefinition, ChartDefinitionError>> {
      const clientResult = await userServiceClient.getLlmClient(userId);

      if (!clientResult.ok) {
        const error = clientResult.error;
        if (error.code === 'NO_API_KEY') {
          return err({
            code: 'NO_API_KEY',
            message: 'Please configure your LLM API key in settings first',
          });
        }
        return err({
          code: 'USER_SERVICE_ERROR',
          message: error.message,
        });
      }

      const llmClient = clientResult.value;

      const prompt = chartDefinitionPrompt.build({
        jsonSchema,
        snapshotData,
        targetChartSchema,
        insight,
      });

      const result = await llmClient.generate(prompt);

      if (!result.ok) {
        return err({
          code: 'GENERATION_ERROR',
          message: result.error.message,
        });
      }

      const responseContent = result.value.content.trim();

      try {
        const parsed = parseChartDefinition(responseContent);
        return ok(parsed);
      } catch (error) {
        const errorMessage = getErrorMessage(error, String(error));
        const detailedError = createDetailedParseErrorMessage({
          errorMessage,
          llmResponse: responseContent,
          expectedSchema: CHART_DEFINITION_SCHEMA,
          operation: 'generateChartDefinition',
        });
        logger?.warn(
          {
            operation: 'generateChartDefinition',
            errorMessage,
            llmResponse: responseContent.slice(0, 1000),
            expectedSchema: CHART_DEFINITION_SCHEMA,
            responseLength: responseContent.length,
          },
          'LLM parse error in generateChartDefinition'
        );
        return err({
          code: 'PARSE_ERROR',
          message: detailedError,
        });
      }
    },
  };
}
