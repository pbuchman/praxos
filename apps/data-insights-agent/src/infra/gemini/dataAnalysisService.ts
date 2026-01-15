/**
 * Data analysis service using LLM client.
 * Analyzes composite feed data and generates up to 5 measurable insights.
 */

import type { Result, Logger } from '@intexuraos/common-core';
import { err, getErrorMessage, ok } from '@intexuraos/common-core';
import {
  createDetailedParseErrorMessage,
  dataAnalysisPrompt,
  parseInsightResponse,
  type ChartTypeInfo,
  type ParsedDataInsight,
} from '@intexuraos/llm-common';
import type { UserServiceClient } from '../user/userServiceClient.js';

/**
 * Error from data analysis operations.
 */
export interface DataAnalysisError {
  code: 'NO_API_KEY' | 'GENERATION_ERROR' | 'USER_SERVICE_ERROR' | 'PARSE_ERROR';
  message: string;
}

/**
 * Result of data analysis.
 */
export interface DataAnalysisResult {
  insights: ParsedDataInsight[];
  noInsightsReason?: string;
}

/**
 * Expected schema for data analysis response.
 */
const DATA_ANALYSIS_SCHEMA = `Either:
1. NO_INSIGHTS: Reason=... (single line)
2. Multiple INSIGHT_N lines (1-5 insights):
   INSIGHT_1: Title=...; Description=...; Trackable=...; ChartType=...
   INSIGHT_2: Title=...; Description=...; Trackable=...; ChartType=...
   etc.

Requirements:
- Title: non-empty string
- Description: 1-3 sentences max
- Trackable: non-empty string
- ChartType: one of C1, C2, C3, C4, C5, C6`;

/**
 * Data analysis service interface.
 */
export interface DataAnalysisService {
  analyzeData(
    userId: string,
    jsonSchema: object,
    snapshotData: object,
    chartTypes: ChartTypeInfo[]
  ): Promise<Result<DataAnalysisResult, DataAnalysisError>>;
}

/**
 * Create a data analysis service.
 */
export function createDataAnalysisService(
  userServiceClient: UserServiceClient,
  logger?: Logger
): DataAnalysisService {
  return {
    async analyzeData(
      userId: string,
      jsonSchema: object,
      snapshotData: object,
      chartTypes: ChartTypeInfo[]
    ): Promise<Result<DataAnalysisResult, DataAnalysisError>> {
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

      const prompt = dataAnalysisPrompt.build({
        jsonSchema,
        snapshotData,
        chartTypes,
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
        const parsed = parseInsightResponse(responseContent);
        return ok(parsed);
      } catch (error) {
        const errorMessage = getErrorMessage(error, String(error));
        const detailedError = createDetailedParseErrorMessage({
          errorMessage,
          llmResponse: responseContent,
          expectedSchema: DATA_ANALYSIS_SCHEMA,
          operation: 'analyzeData',
        });
        logger?.warn(
          {
            operation: 'analyzeData',
            errorMessage,
            llmResponse: responseContent.slice(0, 1000),
            expectedSchema: DATA_ANALYSIS_SCHEMA,
            responseLength: responseContent.length,
          },
          'LLM parse error in analyzeData'
        );
        return err({
          code: 'PARSE_ERROR',
          message: detailedError,
        });
      }
    },
  };
}
