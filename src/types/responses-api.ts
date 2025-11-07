/**
 * Types for OpenAI Responses API support
 *
 * This module defines types for the new OpenAI Responses API that replaces
 * the traditional Chat Completions API. The Responses API provides a unified
 * interface for building agent-like applications with built-in tools and capabilities.
 *
 * Reference: https://platform.openai.com/docs/guides/migrate-to-responses
 */

import { UsageMetadata } from './index.js';

/**
 * OpenAI Responses API request parameters
 * Based on the official OpenAI Responses API documentation
 * Reference: https://platform.openai.com/docs/guides/migrate-to-responses
 */
export interface OpenAIResponsesRequest {
  /** The model to use for the response */
  model: string;

  /** Input for the response - can be string or message array */
  input:
    | string
    | Array<{
        role: 'user' | 'assistant' | 'system';
        content: string;
      }>;

  /** Whether to stream the response */
  stream?: boolean;

  /** Maximum number of output tokens to generate */
  max_output_tokens?: number;

  /** Temperature for response generation (0.0 to 2.0) */
  temperature?: number;

  /** Top-p sampling parameter (0.0 to 1.0) */
  top_p?: number;

  /** Instructions for the model (replaces system messages) */
  instructions?: string;

  /** Tools available to the model */
  tools?: Array<{
    type: 'function' | 'web_search' | 'file_search' | 'code_interpreter' | 'image_generation';
    // For function tools (internally tagged)
    name?: string;
    description?: string;
    parameters?: {
      type: 'object';
      properties: Record<string, unknown>;
      required?: string[];
      additionalProperties?: boolean;
    };
    // For other tools
    [key: string]: unknown;
  }>;

  /** Tool choice configuration */
  tool_choice?: 'auto' | 'none' | { type: 'function'; name: string };

  /** Structured output configuration */
  text?: {
    format?: {
      type: 'json_schema';
      name: string;
      strict?: boolean;
      schema: {
        type: 'object';
        properties: Record<string, unknown>;
        required?: string[];
        additionalProperties?: boolean;
      };
    };
  };

  /** Metadata for the request */
  metadata?: Record<string, unknown>;

  /** ID of previous response to continue from */
  previous_response_id?: string;

  /** Whether to run in background mode */
  background?: boolean;

  /** Whether to store the response (default: true) */
  store?: boolean;

  /** Parallel tool calls configuration */
  parallel_tool_calls?: boolean;

  /** Reasoning effort level */
  reasoning_effort?: 'low' | 'medium' | 'high';

  /** Include additional data in response */
  include?: Array<'reasoning.encrypted_content'>;

  /** Custom metadata field for Revenium tracking */
  usageMetadata?: UsageMetadata;

  /** Additional parameters */
  [key: string]: unknown;
}

/**
 * OpenAI Responses API response structure
 * Based on the official Azure OpenAI Responses API documentation
 */
export interface OpenAIResponsesResponse {
  /** Unique identifier for the response */
  id: string;

  /** Timestamp when the response was created */
  created_at: number;

  /** The model used for the response */
  model: string;

  /** Response object type */
  object: 'response';

  /** Response status */
  status: 'queued' | 'in_progress' | 'completed' | 'incomplete' | 'cancelled' | 'failed';

  /** Response output array */
  output: Array<{
    id: string;
    type: 'message' | 'function_call' | 'function_call_output' | 'image_generation_call';
    role?: 'assistant';
    content?: Array<{
      type: 'output_text' | 'text';
      text?: string;
      annotations?: Array<unknown>;
    }>;
    name?: string;
    call_id?: string;
    output?: string;
    result?: string;
    status?: string | null;
  }>;

  /** Simplified output text (convenience field) */
  output_text?: string;

  /** Usage statistics */
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    output_tokens_details?: {
      reasoning_tokens: number;
    };
  };

  /** Response metadata */
  metadata?: Record<string, unknown>;

  /** Instructions used */
  instructions?: string | null;

  /** Tools configuration */
  tools?: Array<unknown>;

  /** Tool choice configuration */
  tool_choice?: unknown;

  /** Parallel tool calls setting */
  parallel_tool_calls?: boolean | null;

  /** Temperature used */
  temperature?: number;

  /** Top-p used */
  top_p?: number;

  /** Max output tokens */
  max_output_tokens?: number | null;

  /** Previous response ID */
  previous_response_id?: string | null;

  /** Error information */
  error?: unknown | null;

  /** Incomplete details */
  incomplete_details?: unknown | null;

  /** Reasoning information */
  reasoning?: unknown | null;

  /** Text field */
  text?: unknown | null;

  /** Truncation information */
  truncation?: unknown | null;

  /** User information */
  user?: unknown | null;

  /** Reasoning effort */
  reasoning_effort?: unknown | null;
}

/**
 * Streaming chunk for Responses API
 */
export interface OpenAIResponsesStreamChunk {
  /** Unique identifier for the response */
  id: string;

  /** The model used */
  model: string;

  /** Delta content for this chunk */
  delta?: {
    content?: Array<{
      type: 'text' | 'tool_use';
      text?: string;
      [key: string]: unknown;
    }>;
  };

  /** Usage information (typically in final chunk) */
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
    reasoning_tokens?: number;
    cached_tokens?: number;
  };

  /** Finish reason (in final chunk) */
  finish_reason?: string | null;

  /** Additional chunk fields */
  [key: string]: unknown;
}

/**
 * Type guard to check if a request is for Responses API
 */
export function isResponsesRequest(params: unknown): params is OpenAIResponsesRequest {
  return typeof params === 'object' && params !== null && 'input' in params && 'model' in params;
}

/**
 * Type guard to check if a response is from Responses API
 */
export function isResponsesResponse(response: unknown): response is OpenAIResponsesResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'id' in response &&
    'model' in response &&
    ('output' in response || 'usage' in response)
  );
}

/**
 * Simplified interface for Responses API create parameters (for examples)
 */
export interface ResponsesCreateParams {
  model: string;
  input: string | Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  stream?: boolean;
  max_output_tokens?: number;
  temperature?: number;
  instructions?: string;
  tools?: Array<{
    type: 'function' | 'web_search' | 'file_search' | 'code_interpreter' | 'image_generation';
    function?: {
      name: string;
      description?: string;
      parameters?: Record<string, unknown>;
    };
  }>;
  usageMetadata?: UsageMetadata;
}

/**
 * Simplified interface for Responses API response (for examples)
 */
export interface ResponsesResponse {
  id: string;
  model: string;
  object: 'response';
  status: string;
  output: Array<{
    id: string;
    type: string;
    role?: string;
    content?: Array<{
      type: 'output_text' | 'text';
      text?: string;
    }>;
  }>;
  output_text?: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    output_tokens_details?: {
      reasoning_tokens: number;
    };
  };
}
