/**
 * Instance Patcher Module
 *
 * Handles patching of OpenAI client instances.
 * Extracted from wrapper.ts for better organization.
 */

import OpenAI from 'openai';
import type { ChatCompletionCreateParams } from 'openai/resources/chat/completions';
import type { EmbeddingCreateParams } from 'openai/resources/embeddings';
import { ProviderInfo } from '../../types/index.js';
import {
  OpenAIClientInstance,
  OpenAIChatRequest,
  OpenAIEmbeddingRequest,
  OpenAIRequestOptions,
  OpenAIResponsesOriginalFunction,
} from '../../types/function-parameters.js';
import { isOpenAIClientInstance } from '../../utils/type-guards.js';
import { extractMetadata, createLoggingContext } from '../../utils/metadata-builder.js';
import {
  requestHandlerFactory,
  ensureFactoryInitialized,
} from '../../utils/request-handler-factory.js';
import { getLogger, getConfig } from '../config/index.js';
import { detectProvider } from '../providers/index.js';
import { OpenAIResponsesRequest } from '../../types/responses-api.js';

// Import the type augmentations to ensure they're available
import '../../types/openai-augmentation.js';

// Interface for OpenAI instance with Responses API
interface OpenAIWithResponses extends OpenAIClientInstance {
  responses?: {
    create: (params: OpenAIResponsesRequest, options?: OpenAIRequestOptions) => Promise<unknown>;
  };
}

/**
 * Set to track patched instances
 */
const patchedInstances = new WeakSet();

/**
 * WeakMap to store provider information for each client instance
 */
const instanceProviders = new WeakMap<OpenAIClientInstance, ProviderInfo>();

// Global logger
const logger = getLogger();

/**
 * Get provider information for a client instance
 */
export function getProviderInfo(instance: OpenAIClientInstance): ProviderInfo | undefined {
  return instanceProviders.get(instance);
}

/**
 * Simple approach: Only patch instances when users create them
 * No global patching, no dummy keys - just clean instance patching
 */
export function patchOpenAI(): void {
  logger.info('Revenium OpenAI middleware loaded and ready');
  logger.debug('Use patchOpenAIInstance() to patch specific OpenAI instances');
}

/**
 * Manually patch an existing OpenAI instance
 * This is the main function users should call
 */
export function patchOpenAIInstance(instance: OpenAI): OpenAI {
  // Check if middleware is initialized
  const config = getConfig();
  if (!config) {
    logger.warn('Revenium middleware not initialized.');
    logger.warn(
      'Auto-initialization may have failed. Try calling initializeReveniumFromEnv() explicitly.'
    );
    logger.warn('Check that REVENIUM_METERING_API_KEY environment variable is set.');
    logger.warn(
      'OpenAI instance will be patched but tracking may not work without proper configuration.'
    );
  } else {
    logger.debug('Revenium middleware is properly configured');
  }

  if (patchedInstances.has(instance)) {
    logger.debug('OpenAI instance already patched, skipping');
    return instance;
  }

  patchInstance(instance as unknown as OpenAIClientInstance);
  logger.debug('OpenAI instance patched successfully');

  return instance;
}

/**
 * Patch an individual OpenAI instance
 */
function patchInstance(instance: OpenAIClientInstance): void {
  try {
    // Validate instance
    if (!isOpenAIClientInstance(instance)) {
      logger.error('Invalid OpenAI client instance provided to patchInstance');
      return;
    }

    // Detect provider type for this instance
    const providerInfo = detectProvider(instance);
    instanceProviders.set(instance, providerInfo);

    logger.debug('Provider detection completed for instance', {
      provider: providerInfo.provider,
      isAzure: providerInfo.isAzure,
      hasAzureConfig: !!providerInfo.azureConfig,
    });

    // Patch chat completions
    patchChatCompletions(instance);

    // Patch embeddings
    patchEmbeddings(instance);

    // Patch responses API (new OpenAI Responses API)
    patchResponses(instance);

    // Mark as patched
    patchedInstances.add(instance);
  } catch (error) {
    logger.error('Failed to patch OpenAI instance', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Patch chat completions endpoint
 */
function patchChatCompletions(instance: OpenAIClientInstance): void {
  if (!instance.chat || !instance.chat.completions || !instance.chat.completions.create) {
    return logger.warn('OpenAI instance missing chat.completions.create, skipping chat patch');
  }

  // Store the original create method
  const originalCreate = instance.chat.completions.create.bind(instance.chat.completions);

  // Replace the create method with our wrapped version
  instance.chat.completions.create = async function (
    params: ChatCompletionCreateParams,
    options?: OpenAIRequestOptions
  ) {
    // Extract metadata using utility
    const { metadata, cleanParams } = extractMetadata(params as OpenAIChatRequest);
    const typedParams = params as OpenAIChatRequest;

    logger.debug('OpenAI chat.completions.create intercepted', {
      ...createLoggingContext(metadata),
      model: typedParams.model,
      stream: !!typedParams.stream,
    });

    // Record request start time
    const requestStartTime = Date.now();

    // Ensure factory is initialized and route request
    try {
      await ensureFactoryInitialized();
    } catch (error) {
      logger.error('Failed to initialize request handler factory', { error });
      throw new Error('Middleware initialization failed - cannot process request');
    }
    return requestHandlerFactory.routeChatRequest(
      originalCreate,
      cleanParams,
      options,
      metadata,
      requestStartTime,
      instance
    );
  };
}

/**
 * Patch embeddings endpoint
 */
function patchEmbeddings(instance: OpenAIClientInstance): void {
  if (!instance.embeddings || !instance.embeddings.create) {
    return logger.warn('OpenAI instance missing embeddings.create, skipping embeddings patch');
  }
  // Store the original embeddings create method
  const originalEmbeddingsCreate = instance.embeddings.create.bind(instance.embeddings);

  // Replace the embeddings create method with our wrapped version
  instance.embeddings.create = async function (
    params: EmbeddingCreateParams,
    options?: OpenAIRequestOptions
  ) {
    // Extract metadata using utility
    const { metadata, cleanParams } = extractMetadata(params as OpenAIEmbeddingRequest);
    const typedParams = params as OpenAIEmbeddingRequest;

    logger.debug('OpenAI embeddings.create intercepted', {
      ...createLoggingContext(metadata),
      model: typedParams.model,
      inputType: typeof typedParams.input,
    });

    // Record request start time
    const requestStartTime = Date.now();

    // Ensure factory is initialized and route request
    try {
      await ensureFactoryInitialized();
    } catch (error) {
      logger.error('Failed to initialize request handler factory', { error });
      throw new Error('Middleware initialization failed - cannot process request');
    }
    return requestHandlerFactory.routeEmbeddingsRequest(
      originalEmbeddingsCreate,
      cleanParams,
      options,
      metadata,
      requestStartTime,
      instance
    );
  };
}

/**
 * Patch responses endpoint (new OpenAI Responses API)
 */
function patchResponses(instance: OpenAIClientInstance): void {
  // Type assertion for new Responses API (not yet in OpenAI types)
  const responsesAPI = instance as OpenAIWithResponses;

  // Check if the instance has the responses API (it's a newer feature)
  if (!responsesAPI.responses || !responsesAPI.responses.create) {
    logger.debug(
      'OpenAI instance missing responses.create, skipping responses patch (this is normal for older SDK versions)'
    );
    return;
  }

  // Store the original responses create method
  const originalResponsesCreate = responsesAPI.responses.create.bind(responsesAPI.responses);

  // Replace the responses create method with our wrapped version
  responsesAPI.responses.create = async function (
    params: OpenAIResponsesRequest,
    options?: OpenAIRequestOptions
  ) {
    // Extract metadata using utility (similar to chat completions)
    const { metadata, cleanParams } = extractMetadata(params);

    logger.debug('OpenAI responses.create intercepted', {
      ...createLoggingContext(metadata),
      model: params.model,
      stream: !!params.stream,
      inputType: typeof params.input,
    });

    // Record request start time
    const requestStartTime = Date.now();

    // Ensure factory is initialized and route request
    try {
      await ensureFactoryInitialized();
    } catch (error) {
      logger.error('Failed to initialize request handler factory', { error });
      throw new Error('Middleware initialization failed - cannot process request');
    }
    return requestHandlerFactory.routeResponsesRequest(
      originalResponsesCreate as OpenAIResponsesOriginalFunction,
      cleanParams,
      options,
      metadata,
      requestStartTime,
      instance
    );
  };
}

/**
 * Export instance providers for request handlers
 */
export { instanceProviders };
