/**
 * Data transformation service using LLM client.
 * Transforms snapshot data according to chart definition instructions.
 */

import type { Result, Logger } from '@intexuraos/common-core';
import { err, getErrorMessage, ok } from '@intexuraos/common-core';
import {
  createDetailedParseErrorMessage,
  dataTransformPrompt,
  parseTransformedData,
} from '@intexuraos/llm-common';
import type { UserServiceClient } from '../user/userServiceClient.js';

/**
 * Error from data transformation operations.
 */
export interface DataTransformError {
  code: 'NO_API_KEY' | 'GENERATION_ERROR' | 'USER_SERVICE_ERROR' | 'PARSE_ERROR';
  message: string;
}

/**
 * Expected schema for data transformation response.
 */
const DATA_TRANSFORM_SCHEMA = `DATA_START
[...array of objects...]
DATA_END

Requirements:
- Data must be valid JSON array
- Array cannot be empty
- Each item must be an object (not array, not null)`;

/**
 * Data transformation service interface.
 */
export interface DataTransformService {
  transformData(
    userId: string,
    jsonSchema: object,
    snapshotData: object,
    chartConfig: object,
    transformInstructions: string,
    insight: {
      title: string;
      trackableMetric: string;
    }
  ): Promise<Result<unknown[], DataTransformError>>;
}

/**
 * Create a data transformation service.
 */
export function createDataTransformService(
  userServiceClient: UserServiceClient,
  logger?: Logger
): DataTransformService {
  return {
    async transformData(
      userId: string,
      jsonSchema: object,
      snapshotData: object,
      chartConfig: object,
      transformInstructions: string,
      insight: {
        title: string;
        trackableMetric: string;
      }
    ): Promise<Result<unknown[], DataTransformError>> {
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

      const prompt = dataTransformPrompt.build({
        jsonSchema,
        snapshotData,
        chartConfig,
        transformInstructions,
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
        const parsed = parseTransformedData(responseContent);
        return ok(parsed);
      } catch (error) {
        const errorMessage = getErrorMessage(error, String(error));
        const detailedError = createDetailedParseErrorMessage({
          errorMessage,
          llmResponse: responseContent,
          expectedSchema: DATA_TRANSFORM_SCHEMA,
          operation: 'transformData',
        });
        logger?.warn(
          {
            operation: 'transformData',
            errorMessage,
            llmResponse: responseContent.slice(0, 1000),
            expectedSchema: DATA_TRANSFORM_SCHEMA,
            responseLength: responseContent.length,
          },
          'LLM parse error in transformData'
        );
        return err({
          code: 'PARSE_ERROR',
          message: detailedError,
        });
      }
    },
  };
}
