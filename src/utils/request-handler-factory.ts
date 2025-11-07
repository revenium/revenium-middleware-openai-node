/**
 * Request Handler Factory
 *
 * Eliminates dynamic require() calls and provides a clean factory pattern
 * for creating request handlers with proper dependency injection.
 */

import {
  OpenAIChatRequest,
  OpenAIEmbeddingRequest,
  OpenAIRequestOptions,
  OpenAIClientInstance,
  OpenAIOriginalFunction,
  OpenAIResponsesOriginalFunction,
} from '../types/function-parameters.js';
import { UsageMetadata, OpenAIResponsesRequest } from '../types/index.js';

/**
 * Request handler function signatures
 */
export type StreamingRequestHandler = (
  originalCreate: OpenAIOriginalFunction,
  params: Omit<OpenAIChatRequest, 'usageMetadata'>,
  options: OpenAIRequestOptions | undefined,
  usageMetadata: UsageMetadata | undefined,
  requestStartTime: number,
  instance: OpenAIClientInstance
) => Promise<AsyncIterable<unknown>>;

export type NonStreamingRequestHandler = (
  originalCreate: OpenAIOriginalFunction,
  params: Omit<OpenAIChatRequest, 'usageMetadata'> | Omit<OpenAIEmbeddingRequest, 'usageMetadata'>,
  options: OpenAIRequestOptions | undefined,
  usageMetadata: UsageMetadata | undefined,
  requestStartTime: number,
  instance: OpenAIClientInstance
) => Promise<unknown>;

export type EmbeddingsRequestHandler = (
  originalCreate: OpenAIOriginalFunction,
  params: Omit<OpenAIEmbeddingRequest, 'usageMetadata'>,
  options: OpenAIRequestOptions | undefined,
  usageMetadata: UsageMetadata | undefined,
  requestStartTime: number,
  instance: OpenAIClientInstance
) => Promise<unknown>;

export type ResponsesStreamingRequestHandler = (
  originalCreate: OpenAIResponsesOriginalFunction,
  params: Omit<OpenAIResponsesRequest, 'usageMetadata'>,
  options: OpenAIRequestOptions | undefined,
  usageMetadata: UsageMetadata | undefined,
  requestStartTime: number,
  instance: OpenAIClientInstance
) => Promise<AsyncIterable<unknown>>;

export type ResponsesNonStreamingRequestHandler = (
  originalCreate: OpenAIResponsesOriginalFunction,
  params: Omit<OpenAIResponsesRequest, 'usageMetadata'>,
  options: OpenAIRequestOptions | undefined,
  usageMetadata: UsageMetadata | undefined,
  requestStartTime: number,
  instance: OpenAIClientInstance
) => Promise<unknown>;

/**
 * Request handler dependencies
 */
export interface RequestHandlerDependencies {
  handleStreamingRequest: StreamingRequestHandler;
  handleNonStreamingRequest: NonStreamingRequestHandler;
  handleEmbeddingsRequest: EmbeddingsRequestHandler;
  handleResponsesStreamingRequest: ResponsesStreamingRequestHandler;
  handleResponsesNonStreamingRequest: ResponsesNonStreamingRequestHandler;
}

/**
 * Request handler factory class
 *
 * This eliminates the need for dynamic require() calls and provides
 * a clean dependency injection pattern.
 */
export class RequestHandlerFactory {
  private dependencies: RequestHandlerDependencies | null = null;

  /**
   * Initialize the factory with dependencies
   */
  initialize(dependencies: RequestHandlerDependencies): void {
    this.dependencies = dependencies;
  }

  /**
   * Get streaming request handler
   */
  getStreamingHandler(): StreamingRequestHandler {
    if (!this.dependencies) {
      throw new Error('RequestHandlerFactory not initialized. Call initialize() first.');
    }
    return this.dependencies.handleStreamingRequest;
  }

  /**
   * Get non-streaming request handler
   */
  getNonStreamingHandler(): NonStreamingRequestHandler {
    if (!this.dependencies) {
      throw new Error('RequestHandlerFactory not initialized. Call initialize() first.');
    }
    return this.dependencies.handleNonStreamingRequest;
  }

  /**
   * Get embeddings request handler
   */
  getEmbeddingsHandler(): EmbeddingsRequestHandler {
    if (!this.dependencies) {
      throw new Error('RequestHandlerFactory not initialized. Call initialize() first.');
    }
    return this.dependencies.handleEmbeddingsRequest;
  }

  /**
   * Route chat request to appropriate handler
   */
  routeChatRequest(
    originalCreate: OpenAIOriginalFunction,
    params: Omit<OpenAIChatRequest, 'usageMetadata'>,
    options: OpenAIRequestOptions | undefined,
    usageMetadata: UsageMetadata | undefined,
    requestStartTime: number,
    instance: OpenAIClientInstance
  ): Promise<unknown> {
    if (!this.dependencies) {
      throw new Error('RequestHandlerFactory not initialized. Call initialize() first.');
    }

    // Pass clean params (without usageMetadata) to handlers
    // The handlers will receive usageMetadata separately
    if (params.stream) {
      return this.dependencies.handleStreamingRequest(
        originalCreate,
        params,
        options,
        usageMetadata,
        requestStartTime,
        instance
      );
    } else {
      return this.dependencies.handleNonStreamingRequest(
        originalCreate,
        params,
        options,
        usageMetadata,
        requestStartTime,
        instance
      );
    }
  }

  /**
   * Route embeddings request to appropriate handler
   */
  routeEmbeddingsRequest(
    originalCreate: OpenAIOriginalFunction,
    params: Omit<OpenAIEmbeddingRequest, 'usageMetadata'>,
    options: OpenAIRequestOptions | undefined,
    usageMetadata: UsageMetadata | undefined,
    requestStartTime: number,
    instance: OpenAIClientInstance
  ): Promise<unknown> {
    if (!this.dependencies) {
      throw new Error('RequestHandlerFactory not initialized. Call initialize() first.');
    }

    // Pass clean params (without usageMetadata) to handler
    // The handler will receive usageMetadata separately
    return this.dependencies.handleEmbeddingsRequest(
      originalCreate,
      params,
      options,
      usageMetadata,
      requestStartTime,
      instance
    );
  }

  /**
   * Route responses request to appropriate handler (new OpenAI Responses API)
   */
  routeResponsesRequest(
    originalCreate: OpenAIResponsesOriginalFunction,
    params: Omit<OpenAIResponsesRequest, 'usageMetadata'>,
    options: OpenAIRequestOptions | undefined,
    usageMetadata: UsageMetadata | undefined,
    requestStartTime: number,
    instance: OpenAIClientInstance
  ): Promise<unknown> {
    if (!this.dependencies) {
      throw new Error('RequestHandlerFactory not initialized. Call initialize() first.');
    }

    // Route to appropriate handler based on streaming
    if (params.stream) {
      return this.dependencies.handleResponsesStreamingRequest(
        originalCreate,
        params,
        options,
        usageMetadata,
        requestStartTime,
        instance
      );
    } else {
      return this.dependencies.handleResponsesNonStreamingRequest(
        originalCreate,
        params,
        options,
        usageMetadata,
        requestStartTime,
        instance
      );
    }
  }

  /**
   * Check if factory is initialized
   */
  isInitialized(): boolean {
    return this.dependencies !== null;
  }
}

/**
 * Global factory instance
 */
export const requestHandlerFactory = new RequestHandlerFactory();

/**
 * Initialize the global factory (called once during module setup)
 * Uses dynamic import to avoid circular dependencies
 */
export async function initializeRequestHandlerFactory(): Promise<void> {
  // Use dynamic import instead of require for better TypeScript support
  const handlerModule = await import('../core/wrapper/request-handler.js');

  requestHandlerFactory.initialize({
    handleStreamingRequest: handlerModule.handleStreamingRequest,
    handleNonStreamingRequest: handlerModule.handleNonStreamingRequest,
    handleEmbeddingsRequest: handlerModule.handleEmbeddingsRequest,
    handleResponsesStreamingRequest: handlerModule.handleResponsesStreamingRequest,
    handleResponsesNonStreamingRequest: handlerModule.handleResponsesNonStreamingRequest,
  });
}

// Promise cache to prevent race conditions during initialization
let initializationPromise: Promise<void> | null = null;

/**
 * Utility function to ensure factory is initialized
 */
export async function ensureFactoryInitialized(): Promise<void> {
  if (!requestHandlerFactory.isInitialized()) {
    if (!initializationPromise) {
      initializationPromise = initializeRequestHandlerFactoryAsync();
    }
    await initializationPromise;
  }
}

/**
 * Async initialization for ES Module compatibility
 * Uses dynamic import for ES Module compatibility
 */
async function initializeRequestHandlerFactoryAsync(): Promise<void> {
  // Use dynamic import for ES Module compatibility
  const handlerModule = await import('../core/wrapper/request-handler.js');

  requestHandlerFactory.initialize({
    handleStreamingRequest: handlerModule.handleStreamingRequest,
    handleNonStreamingRequest: handlerModule.handleNonStreamingRequest,
    handleEmbeddingsRequest: handlerModule.handleEmbeddingsRequest,
    handleResponsesStreamingRequest: handlerModule.handleResponsesStreamingRequest,
    handleResponsesNonStreamingRequest: handlerModule.handleResponsesNonStreamingRequest,
  });
}
