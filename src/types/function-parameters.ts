/**
 * Function Parameter Types
 *
 * Comprehensive type definitions for function parameters throughout the middleware.
 * These interfaces provide type safety by replacing 'any' types with proper,
 * well-documented interfaces that match OpenAI API structures and internal requirements.
 *
 * @fileoverview Type-safe function parameter definitions
 * @author Revenium
 * @since 1.0.0
 */

import { UsageMetadata, ProviderInfo } from './index';
import { OpenAIResponsesRequest } from './responses-api';

/**
 * OpenAI API response structure for chat completions
 *
 * Represents the complete response structure returned by OpenAI's chat completions API.
 * Includes usage statistics, response choices, and metadata. Used internally for
 * processing responses and extracting usage metrics.
 *
 * @public
 * @example
 * ```typescript
 * const response: OpenAIChatResponse = {
 *   id: 'chatcmpl-123',
 *   model: 'gpt-4o-mini',
 *   usage: {
 *     prompt_tokens: 10,
 *     completion_tokens: 20,
 *     total_tokens: 30
 *   },
 *   choices: [{
 *     finish_reason: 'stop',
 *     message: {
 *       content: 'Hello! How can I help you?',
 *       role: 'assistant'
 *     }
 *   }]
 * };
 * ```
 */
export interface OpenAIChatResponse {
  /** Unique identifier for the chat completion */
  id: string;
  /** Model used for the completion */
  model: string;
  /** Token usage statistics */
  usage: {
    /** Number of tokens in the prompt */
    prompt_tokens: number;
    /** Number of tokens in the completion */
    completion_tokens: number;
    /** Total tokens used (prompt + completion) */
    total_tokens: number;
    /** Number of reasoning tokens (for reasoning models) */
    reasoning_tokens?: number;
    /** Number of cached tokens used */
    cached_tokens?: number;
  };
  /** Array of completion choices */
  choices: Array<{
    /** Reason why the completion finished */
    finish_reason: string | null;
    /** Complete message (for non-streaming responses) */
    message?: {
      /** Message content */
      content: string;
      /** Message role (assistant, user, system) */
      role: string;
    };
    /** Delta message (for streaming responses) */
    delta?: {
      /** Incremental content */
      content?: string;
      /** Message role */
      role?: string;
    };
  }>;
  /** Unix timestamp of when the completion was created */
  created?: number;
  /** Object type identifier */
  object?: string;
}

/**
 * OpenAI API response structure for embeddings
 */
export interface OpenAIEmbeddingResponse {
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
  data: Array<{
    embedding: number[];
    index: number;
    object: string;
  }>;
  object: string;
}

/**
 * OpenAI chat completion request parameters
 */
export interface OpenAIChatRequest {
  model: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
  stream?: boolean;
  usageMetadata?: UsageMetadata;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
  [key: string]: unknown;
}

/**
 * OpenAI embeddings request parameters
 */
export interface OpenAIEmbeddingRequest {
  model: string;
  input: string | string[];
  usageMetadata?: UsageMetadata;
  encoding_format?: string;
  dimensions?: number;
  user?: string;
  [key: string]: unknown;
}

/**
 * OpenAI client instance interface
 */
export interface OpenAIClientInstance {
  baseURL?: string | URL;
  constructor?: {
    name: string;
  };
  chat?: {
    completions?: {
      create: any;
    };
  };
  embeddings?: {
    create: any;
  };
  // Allow additional properties for flexibility with proper typing
  [key: string]: unknown;
}

/**
 * OpenAI request options
 */
export interface OpenAIRequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  signal?: AbortSignal;
  [key: string]: unknown;
}

/**
 * Azure model resolver function parameters
 */
export interface AzureModelResolverParams {
  deploymentName: string;
  useCache?: boolean;
}

/**
 * Provider detection function parameters
 */
export interface ProviderDetectionParams {
  client: OpenAIClientInstance;
}

/**
 * Azure configuration validation result
 */
export interface AzureConfigValidationResult {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
}

/**
 * Lazy loading function type for Azure modules
 */
export interface LazyLoadedModule {
  [key: string]: any;
}

/**
 * Console logger arguments type
 */
export type LoggerArgs = unknown[];

/**
 * Generic function type for original OpenAI methods
 */
export type OpenAIOriginalFunction = (
  params: OpenAIChatRequest | OpenAIEmbeddingRequest,
  options?: OpenAIRequestOptions
) => Promise<OpenAIChatResponse | OpenAIEmbeddingResponse>;

/**
 * Function type for original OpenAI Responses API methods
 */
export type OpenAIResponsesOriginalFunction = (
  params: OpenAIResponsesRequest,
  options?: OpenAIRequestOptions
) => Promise<unknown>;

/**
 * Stream chunk interface for streaming responses
 */
export interface StreamChunk {
  id: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    reasoning_tokens?: number;
    cached_tokens?: number;
  };
  choices?: Array<{
    delta?: {
      content?: string;
      role?: string;
    };
    finish_reason?: string | null;
  }>;
  [key: string]: unknown;
}

/**
 * Extended usage interface that includes optional reasoning and cached tokens
 */
export interface ExtendedUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  reasoning_tokens?: number;
  cached_tokens?: number;
}
