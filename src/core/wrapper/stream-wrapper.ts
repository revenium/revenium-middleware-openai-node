/**
 * Stream Wrapper Module
 *
 * Handles wrapping of streaming responses for usage tracking.
 * Extracted from wrapper.ts for better organization.
 */

import { UsageMetadata } from '../../types/index.js';
import {
  OpenAIClientInstance,
  StreamChunk,
  ExtendedUsage,
} from '../../types/function-parameters.js';
import { isStreamChunk } from '../../utils/type-guards.js';
import { trackUsageAsync } from '../tracking/index.js';
import { getLogger } from '../config/index.js';
import { instanceProviders } from './instance-patcher.js';

// Global logger
const logger = getLogger();

/**
 * Create a simple stream wrapper that tracks usage when complete
 */
export function createTrackingStreamWrapper(
  originalStream: AsyncIterable<unknown>,
  usageMetadata: UsageMetadata | undefined,
  requestStartTime: number,
  instance: OpenAIClientInstance
): AsyncIterable<unknown> {
  // For streaming, we need to collect the final response data
  let accumulatedResponse: StreamChunk | null = null;

  // Create async iterator
  const wrappedIterator = {
    async *[Symbol.asyncIterator]() {
      try {
        for await (const chunk of originalStream) {
          // Validate and accumulate response data for tracking
          if (isStreamChunk(chunk)) {
            if (!accumulatedResponse) {
              accumulatedResponse = {
                id: chunk.id,
                model: chunk.model,
                usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
              };
            }

            // Update usage if available in chunk
            if (chunk.usage) {
              accumulatedResponse.usage = chunk.usage;
            }
          }

          // Forward the chunk to the client
          yield chunk;
        }

        // Stream completed - track usage
        if (accumulatedResponse && accumulatedResponse.usage) {
          const duration = Date.now() - requestStartTime;

          // Get provider info for this instance
          const providerInfo = instanceProviders.get(instance);

          // Safely access extended usage fields
          const usage = accumulatedResponse.usage as ExtendedUsage;

          trackUsageAsync({
            requestId: accumulatedResponse.id,
            model: accumulatedResponse.model,
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens || 0,
            totalTokens: usage.total_tokens,
            reasoningTokens: usage.reasoning_tokens,
            cachedTokens: usage.cached_tokens,
            duration,
            finishReason: null, // Will be determined from final chunk
            usageMetadata,
            isStreamed: true,
            providerInfo,
          });

          logger.debug('Chat completion streaming completed', {
            model: accumulatedResponse.model,
            duration,
            totalTokens: accumulatedResponse.usage.total_tokens,
          });
        }
      } catch (error) {
        logger.error('Chat completion streaming error', {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
  };

  return wrappedIterator;
}
