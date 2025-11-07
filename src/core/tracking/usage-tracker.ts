/**
 * Usage Tracker Module
 *
 * High-level tracking functions that combine payload building and API communication.
 * Extracted from tracking.ts for better organization.
 */

import { randomUUID } from 'crypto';
import { UsageMetadata, ProviderInfo } from '../../types/index.js';
import {
  OpenAIChatResponse,
  OpenAIEmbeddingResponse,
  OpenAIChatRequest,
  OpenAIEmbeddingRequest,
} from '../../types/function-parameters.js';
import { getLogger } from '../config/index.js';
import { sendToRevenium } from './api-client.js';
import { buildPayload } from './payload-builder.js';
import { safeAsyncOperation } from '../../utils/error-handler.js';

// Global logger
const logger = getLogger();

/**
 * Chat completions tracking - now a thin wrapper with Azure support
 */
export async function sendReveniumMetrics(
  response: OpenAIChatResponse,
  request: OpenAIChatRequest,
  startTime: number,
  duration: number,
  providerInfo?: ProviderInfo
): Promise<void> {
  await safeAsyncOperation(
    async () => {
      const payload = buildPayload('CHAT', response, request, startTime, duration, providerInfo);
      await sendToRevenium(payload);
    },
    'Chat completion tracking',
    {
      logError: true,
      rethrow: false, // Don't rethrow to maintain fire-and-forget behavior
      messagePrefix: 'Chat completion tracking failed: ',
    },
    logger
  );
}

/**
 * Embeddings tracking - now a thin wrapper with Azure support
 */
export async function sendReveniumEmbeddingsMetrics(
  response: OpenAIEmbeddingResponse,
  request: OpenAIEmbeddingRequest,
  startTime: number,
  duration: number,
  providerInfo?: ProviderInfo
): Promise<void> {
  await safeAsyncOperation(
    async () => {
      const payload = buildPayload('EMBED', response, request, startTime, duration, providerInfo);
      await sendToRevenium(payload);
    },
    'Embeddings tracking',
    {
      logError: true,
      rethrow: false, // Don't rethrow to maintain fire-and-forget behavior
      messagePrefix: 'Embeddings tracking failed: ',
    },
    logger
  );
}

/**
 * Fire-and-forget wrapper for chat completions with Azure support
 */
export function trackUsageAsync(trackingData: {
  requestId: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  reasoningTokens?: number;
  cachedTokens?: number;
  duration: number;
  finishReason: string | null;
  usageMetadata?: UsageMetadata;
  isStreamed?: boolean;
  timeToFirstToken?: number;
  providerInfo?: ProviderInfo;
}): void {
  const mockResponse = {
    id: trackingData.requestId,
    model: trackingData.model,
    usage: {
      prompt_tokens: trackingData.promptTokens,
      completion_tokens: trackingData.completionTokens,
      total_tokens: trackingData.totalTokens,
      ...(trackingData.reasoningTokens && { reasoning_tokens: trackingData.reasoningTokens }),
      ...(trackingData.cachedTokens && { cached_tokens: trackingData.cachedTokens }),
    },
    choices: [
      {
        finish_reason: trackingData.finishReason,
      },
    ],
  };

  const mockRequest: OpenAIChatRequest = {
    model: trackingData.model,
    messages: [], // Mock empty messages array for type compliance
    usageMetadata: trackingData.usageMetadata,
    stream: trackingData.isStreamed,
  };

  const startTime = Date.now() - trackingData.duration;

  sendReveniumMetrics(
    mockResponse,
    mockRequest,
    startTime,
    trackingData.duration,
    trackingData.providerInfo
  )
    .then(() => {
      logger.debug('Usage tracking completed successfully', {
        requestId: trackingData.requestId,
        model: trackingData.model,
        totalTokens: trackingData.totalTokens,
        isStreamed: trackingData.isStreamed,
      });
    })
    .catch(error => {
      logger.warn('Usage tracking failed', {
        error: error instanceof Error ? error.message : String(error),
        requestId: trackingData.requestId,
        model: trackingData.model,
      });
    });
}

/**
 * Fire-and-forget wrapper for embeddings with Azure support
 */
export function trackEmbeddingsUsageAsync(trackingData: {
  transactionId: string;
  model: string;
  promptTokens: number;
  totalTokens: number;
  duration: number;
  usageMetadata?: UsageMetadata;
  requestStartTime: number;
  providerInfo?: ProviderInfo;
}): void {
  const mockResponse: OpenAIEmbeddingResponse = {
    model: trackingData.model,
    usage: {
      prompt_tokens: trackingData.promptTokens,
      total_tokens: trackingData.totalTokens,
    },
    data: [], // Mock empty data array for type compliance
    object: 'list',
  };

  const mockRequest: OpenAIEmbeddingRequest = {
    model: trackingData.model,
    input: '', // Mock empty input for type compliance
    usageMetadata: trackingData.usageMetadata,
  };

  sendReveniumEmbeddingsMetrics(
    mockResponse,
    mockRequest,
    trackingData.requestStartTime,
    trackingData.duration,
    trackingData.providerInfo
  )
    .then(() => {
      logger.debug('Embeddings tracking completed successfully', {
        transactionId: trackingData.transactionId,
      });
    })
    .catch(error => {
      logger.warn('Embeddings tracking failed', {
        error: error instanceof Error ? error.message : String(error),
        transactionId: trackingData.transactionId,
      });
    });
}
