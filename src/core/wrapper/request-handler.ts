/**
 * Request Handler Module
 *
 * Handles different types of OpenAI requests (streaming, non-streaming, embeddings).
 * Extracted from wrapper.ts for better organization.
 */

import { randomUUID } from 'crypto';
import { UsageMetadata, OpenAIResponsesRequest } from '../../types/index.js';
import {
  OpenAIChatResponse,
  OpenAIEmbeddingResponse,
  OpenAIChatRequest,
  OpenAIEmbeddingRequest,
  OpenAIClientInstance,
  OpenAIRequestOptions,
  OpenAIOriginalFunction,
  OpenAIResponsesOriginalFunction,
} from '../../types/function-parameters.js';
import {
  isOpenAIChatResponse,
  isOpenAIEmbeddingResponse,
  hasValidUsage,
} from '../../utils/type-guards.js';
import { safeAsyncOperation, NetworkError, classifyError } from '../../utils/error-handler.js';
import { createLoggingContext } from '../../utils/metadata-builder.js';
import { trackUsageAsync, trackEmbeddingsUsageAsync } from '../tracking/index.js';
import { getLogger } from '../config/index.js';
import { instanceProviders } from './instance-patcher.js';
import { createTrackingStreamWrapper } from './stream-wrapper.js';

// Global logger
const logger = getLogger();

/**
 * Handle non-streaming OpenAI requests
 */
export async function handleNonStreamingRequest(
  originalCreate: OpenAIOriginalFunction,
  params: Omit<OpenAIChatRequest, 'usageMetadata'> | Omit<OpenAIEmbeddingRequest, 'usageMetadata'>,
  options: OpenAIRequestOptions | undefined,
  usageMetadata: UsageMetadata | undefined,
  requestStartTime: number,
  instance: OpenAIClientInstance
): Promise<OpenAIChatResponse | OpenAIEmbeddingResponse> {
  const loggingContext = createLoggingContext(usageMetadata);

  const result = await safeAsyncOperation(
    async () => {
      // Call the original OpenAI method (cast params back to original type since usageMetadata is removed)
      const response = await originalCreate(params as any, options);

      // Validate response structure
      if (!hasValidUsage(response)) {
        logger.warn('Invalid response structure from OpenAI API', {
          ...loggingContext,
          response,
        });
        return response;
      }

      // Calculate duration
      const duration = Date.now() - requestStartTime;

      // Get provider info for this instance
      const providerInfo = instanceProviders.get(instance);

      // Track usage for chat completions
      if (isOpenAIChatResponse(response)) {
        trackUsageAsync({
          requestId: response.id,
          model: response.model,
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens || 0,
          totalTokens: response.usage.total_tokens,
          reasoningTokens: response.usage.reasoning_tokens,
          cachedTokens: response.usage.cached_tokens,
          duration,
          finishReason: response.choices?.[0]?.finish_reason || null,
          usageMetadata,
          isStreamed: false,
          providerInfo,
        });
      }

      logger.debug('Chat completion request completed', {
        ...loggingContext,
        model: response.model,
        duration,
        totalTokens: response.usage.total_tokens,
      });

      return response;
    },
    'Non-streaming OpenAI request',
    {
      logError: true,
      rethrow: true,
      messagePrefix: 'Chat completion request failed: ',
      transformError: error => {
        const classified = classifyError(error);
        if (classified.type === 'network') {
          return new NetworkError(classified.message, {
            ...loggingContext,
            duration: Date.now() - requestStartTime,
          });
        }
        return error instanceof Error ? error : new Error(String(error));
      },
    },
    logger
  );

  if (!result) throw new Error('OpenAI request failed without specific error');
  return result;
}

/**
 * Handle streaming OpenAI requests
 */
export async function handleStreamingRequest(
  originalCreate: OpenAIOriginalFunction,
  params: Omit<OpenAIChatRequest, 'usageMetadata'>,
  options: OpenAIRequestOptions | undefined,
  usageMetadata: UsageMetadata | undefined,
  requestStartTime: number,
  instance: OpenAIClientInstance
): Promise<AsyncIterable<unknown>> {
  try {
    // Ensure stream_options includes usage data for token tracking
    const enhancedParams = {
      ...params,
      stream_options: {
        include_usage: true,
        ...(params.stream_options || {}),
      },
    };

    logger.debug('Enhanced streaming params with usage tracking', {
      originalStreamOptions: params.stream_options,
      enhancedStreamOptions: enhancedParams.stream_options,
    });

    // Call the original OpenAI method to get the stream (cast params back to original type since usageMetadata is removed)
    const originalStream = await originalCreate(enhancedParams as any, options);

    logger.debug('Chat completion streaming request initiated', {
      model: params.model,
    });

    // Return a wrapped stream that tracks usage when complete
    return createTrackingStreamWrapper(
      originalStream as unknown as AsyncIterable<unknown>,
      usageMetadata,
      requestStartTime,
      instance
    );
  } catch (error) {
    const duration = Date.now() - requestStartTime;
    logger.error('Chat completion streaming request failed', {
      error: error instanceof Error ? error.message : String(error),
      duration,
    });

    // Re-throw the error to maintain original behavior
    throw error;
  }
}

/**
 * Handle embeddings requests
 */
export async function handleEmbeddingsRequest(
  originalCreate: OpenAIOriginalFunction,
  params: Omit<OpenAIEmbeddingRequest, 'usageMetadata'>,
  options: OpenAIRequestOptions | undefined,
  usageMetadata: UsageMetadata | undefined,
  requestStartTime: number,
  instance: OpenAIClientInstance
): Promise<OpenAIEmbeddingResponse> {
  try {
    // Call the original OpenAI method (cast params back to original type since usageMetadata is removed)
    const response = await originalCreate(params as any, options);

    // Validate response structure
    if (!isOpenAIEmbeddingResponse(response)) {
      logger.warn('Invalid embeddings response structure from OpenAI API', { response });
      return response as unknown as OpenAIEmbeddingResponse;
    }

    // Calculate duration
    const duration = Date.now() - requestStartTime;

    // Get provider info for this instance
    const providerInfo = instanceProviders.get(instance);

    // Track embeddings usage
    trackEmbeddingsUsageAsync({
      transactionId: `embed-${randomUUID()}`,
      model: response.model,
      promptTokens: response.usage.prompt_tokens,
      totalTokens: response.usage.total_tokens,
      duration,
      usageMetadata,
      requestStartTime,
      providerInfo,
    });

    logger.debug('Embeddings request completed', {
      model: response.model,
      duration,
      totalTokens: response.usage.total_tokens,
    });

    return response;
  } catch (error) {
    const duration = Date.now() - requestStartTime;
    logger.error('Embeddings request failed', {
      error: error instanceof Error ? error.message : String(error),
      duration,
    });

    // Re-throw the error to maintain original behavior
    throw error;
  }
}

/**
 * Handle non-streaming OpenAI Responses API requests
 */
export async function handleResponsesNonStreamingRequest(
  originalCreate: OpenAIResponsesOriginalFunction,
  params: Omit<OpenAIResponsesRequest, 'usageMetadata'>,
  options: OpenAIRequestOptions | undefined,
  usageMetadata: UsageMetadata | undefined,
  requestStartTime: number,
  instance: OpenAIClientInstance
): Promise<unknown> {
  const loggingContext = createLoggingContext(usageMetadata);

  const result = await safeAsyncOperation(
    async () => {
      // Call the original OpenAI method (cast params back to original type since usageMetadata is removed)
      const response = await originalCreate(params as any, options);

      // Validate response structure
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response from OpenAI Responses API');
      }

      const duration = Date.now() - requestStartTime;

      // Extract usage information (Responses API may have different structure)
      const usage = (response as any).usage;
      if (usage) {
        // Track usage asynchronously using similar pattern to chat completions
        trackUsageAsync({
          requestId: (response as any).id || randomUUID(),
          model: (response as any).model || params.model,
          promptTokens: usage.input_tokens || 0,
          completionTokens: usage.output_tokens || 0,
          totalTokens: usage.total_tokens || 0,
          reasoningTokens: usage.reasoning_tokens,
          cachedTokens: usage.cached_tokens,
          duration,
          finishReason: (response as any).finish_reason || 'completed',
          usageMetadata,
          isStreamed: false,
          providerInfo: instanceProviders.get(instance),
        });
      }

      logger.debug('Responses API request completed', {
        ...loggingContext,
        model: (response as any).model,
        duration,
        totalTokens: usage?.total_tokens,
      });

      return response;
    },
    'Non-streaming OpenAI Responses API request',
    {
      logError: true,
      rethrow: true,
      messagePrefix: 'Responses API request failed: ',
      transformError: error => {
        const classified = classifyError(error);
        if (classified.type === 'network') {
          return new NetworkError(classified.message, {
            ...loggingContext,
            duration: Date.now() - requestStartTime,
          });
        }
        return error instanceof Error ? error : new Error(String(error));
      },
    },
    logger
  );

  if (!result) throw new Error('OpenAI Responses API request failed without specific error');
  return result;
}

/**
 * Handle streaming OpenAI Responses API requests
 */
export async function handleResponsesStreamingRequest(
  originalCreate: OpenAIResponsesOriginalFunction,
  params: Omit<OpenAIResponsesRequest, 'usageMetadata'>,
  options: OpenAIRequestOptions | undefined,
  usageMetadata: UsageMetadata | undefined,
  requestStartTime: number,
  instance: OpenAIClientInstance
): Promise<AsyncIterable<unknown>> {
  try {
    // Call the original OpenAI method to get the stream (cast params back to original type since usageMetadata is removed)
    const originalStream = await originalCreate(params as any, options);

    logger.debug('Responses API streaming request initiated', {
      model: params.model,
    });

    // Return a wrapped stream that tracks usage when complete
    // We'll use a similar pattern to chat completions but adapted for Responses API
    return createResponsesTrackingStreamWrapper(
      originalStream as unknown as AsyncIterable<unknown>,
      usageMetadata,
      requestStartTime,
      instance
    );
  } catch (error) {
    const duration = Date.now() - requestStartTime;
    logger.error('Responses API streaming request failed', {
      error: error instanceof Error ? error.message : String(error),
      duration,
    });

    // Re-throw the error to maintain original behavior
    throw error;
  }
}

/**
 * Create a tracking stream wrapper for Responses API
 * Similar to createTrackingStreamWrapper but adapted for Responses API structure
 */
async function* createResponsesTrackingStreamWrapper(
  originalStream: AsyncIterable<unknown>,
  usageMetadata: UsageMetadata | undefined,
  requestStartTime: number,
  instance: OpenAIClientInstance
): AsyncIterable<unknown> {
  let firstChunkTime: number | undefined;
  let finalUsage: any = null;
  let model = '';
  let requestId = '';
  let finishReason: string | null = null;

  try {
    for await (const chunk of originalStream) {
      // Record time to first token
      if (!firstChunkTime) {
        firstChunkTime = Date.now();
      }

      // Extract information from chunk (Responses API structure may differ)
      if (chunk && typeof chunk === 'object') {
        const chunkObj = chunk as any;

        // Extract model and ID from chunk
        if (chunkObj.model) model = chunkObj.model;
        if (chunkObj.id) requestId = chunkObj.id;

        // Check for final usage information
        if (chunkObj.usage) {
          finalUsage = chunkObj.usage;
        }

        // Check for finish reason
        if (chunkObj.finish_reason) {
          finishReason = chunkObj.finish_reason;
        }
      }

      yield chunk;
    }

    // Track usage after stream completes
    if (finalUsage) {
      const duration = Date.now() - requestStartTime;
      const timeToFirstToken = firstChunkTime ? firstChunkTime - requestStartTime : undefined;

      trackUsageAsync({
        requestId: requestId || randomUUID(),
        model: model,
        promptTokens: finalUsage.input_tokens || 0,
        completionTokens: finalUsage.output_tokens || 0,
        totalTokens: finalUsage.total_tokens || 0,
        reasoningTokens: finalUsage.reasoning_tokens,
        cachedTokens: finalUsage.cached_tokens,
        duration,
        finishReason: finishReason || 'completed',
        usageMetadata,
        isStreamed: true,
        timeToFirstToken,
        providerInfo: instanceProviders.get(instance),
      });

      logger.debug('Responses API streaming completed', {
        model,
        duration,
        timeToFirstToken,
        totalTokens: finalUsage.total_tokens,
      });
    }
  } catch (error) {
    logger.error('Error in Responses API stream wrapper', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
