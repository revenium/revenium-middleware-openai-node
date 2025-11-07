/**
 * Type Guards Module
 *
 * Runtime type checking utilities to ensure type safety.
 * These functions validate that objects match expected interfaces.
 */

import {
  OpenAIChatResponse,
  OpenAIEmbeddingResponse,
  OpenAIChatRequest,
  OpenAIEmbeddingRequest,
  OpenAIClientInstance,
  StreamChunk,
} from '../types/function-parameters.js';

/**
 * Type guard for OpenAI chat response
 */
export function isOpenAIChatResponse(obj: unknown): obj is OpenAIChatResponse {
  if (!obj || typeof obj !== 'object') return false;

  const response = obj as Record<string, unknown>;
  return (
    typeof response.id === 'string' &&
    typeof response.model === 'string' &&
    typeof response.usage === 'object' &&
    response.usage !== null &&
    typeof (response.usage as Record<string, unknown>).prompt_tokens === 'number' &&
    typeof (response.usage as Record<string, unknown>).completion_tokens === 'number' &&
    typeof (response.usage as Record<string, unknown>).total_tokens === 'number' &&
    Array.isArray(response.choices)
  );
}

/**
 * Type guard for OpenAI embedding response
 */
export function isOpenAIEmbeddingResponse(obj: unknown): obj is OpenAIEmbeddingResponse {
  if (!obj || typeof obj !== 'object') return false;

  const response = obj as Record<string, unknown>;
  return (
    typeof response.model === 'string' &&
    typeof response.usage === 'object' &&
    response.usage !== null &&
    typeof (response.usage as Record<string, unknown>).prompt_tokens === 'number' &&
    typeof (response.usage as Record<string, unknown>).total_tokens === 'number' &&
    Array.isArray(response.data) &&
    typeof response.object === 'string'
  );
}

/**
 * Type guard for OpenAI chat request
 */
export function isOpenAIChatRequest(obj: unknown): obj is OpenAIChatRequest {
  if (!obj || typeof obj !== 'object') return false;

  const request = obj as Record<string, unknown>;
  return (
    typeof request.model === 'string' &&
    Array.isArray(request.messages) &&
    request.messages.length > 0 &&
    request.messages.every((msg: unknown) => {
      if (!msg || typeof msg !== 'object') return false;
      const message = msg as Record<string, unknown>;
      return typeof message.role === 'string' && typeof message.content === 'string';
    })
  );
}

/**
 * Type guard for OpenAI embedding request
 */
export function isOpenAIEmbeddingRequest(obj: unknown): obj is OpenAIEmbeddingRequest {
  if (!obj || typeof obj !== 'object') return false;

  const request = obj as Record<string, unknown>;
  return (
    typeof request.model === 'string' &&
    (typeof request.input === 'string' || Array.isArray(request.input))
  );
}

/**
 * Type guard for OpenAI client instance
 */
export function isOpenAIClientInstance(obj: unknown): obj is OpenAIClientInstance {
  if (!obj || typeof obj !== 'object') return false;

  const client = obj as Record<string, unknown>;

  // Must have at least one of the expected OpenAI client properties
  const hasBaseURL = typeof client.baseURL === 'string' || client.baseURL instanceof URL;
  const hasChat = typeof client.chat === 'object' && client.chat !== null;
  const hasEmbeddings = typeof client.embeddings === 'object' && client.embeddings !== null;

  // A valid OpenAI client should have at least one of these properties
  return hasBaseURL || hasChat || hasEmbeddings;
}

/**
 * Type guard for stream chunk
 */
export function isStreamChunk(obj: unknown): obj is StreamChunk {
  if (!obj || typeof obj !== 'object') return false;
  const chunk = obj as Record<string, unknown>;
  return typeof chunk.id === 'string' && typeof chunk.model === 'string';
}

/**
 * Type guard for usage object
 */
export function hasValidUsage(
  obj: unknown
): obj is { usage: { prompt_tokens: number; total_tokens: number } } {
  if (!obj || typeof obj !== 'object') return false;

  const response = obj as Record<string, unknown>;
  return (
    typeof response.usage === 'object' &&
    response.usage !== null &&
    typeof (response.usage as Record<string, unknown>).prompt_tokens === 'number' &&
    typeof (response.usage as Record<string, unknown>).total_tokens === 'number'
  );
}

/**
 * Type guard for function
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isFunction(obj: unknown): obj is any {
  return typeof obj === 'function';
}

/**
 * Type guard for string
 */
export function isString(obj: unknown): obj is string {
  return typeof obj === 'string';
}

/**
 * Type guard for number
 */
export function isNumber(obj: unknown): obj is number {
  return typeof obj === 'number' && !isNaN(obj);
}

/**
 * Type guard for boolean
 */
export function isBoolean(obj: unknown): obj is boolean {
  return typeof obj === 'boolean';
}

/**
 * Type guard for object
 */
export function isObject(obj: unknown): obj is Record<string, unknown> {
  return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
}

/**
 * Type guard for array
 */
export function isArray(obj: unknown): obj is unknown[] {
  return Array.isArray(obj);
}

/**
 * Safe property access with type checking
 */
export function safeGetProperty<T>(
  obj: unknown,
  property: string,
  typeGuard: (value: unknown) => value is T
): T | undefined {
  if (!isObject(obj)) return undefined;

  const value = obj[property];
  return typeGuard(value) ? value : undefined;
}

/**
 * Safe nested property access
 */
export function safeGetNestedProperty<T>(
  obj: unknown,
  path: string[],
  typeGuard: (value: unknown) => value is T
): T | undefined {
  let current = obj;

  for (const property of path) {
    if (!isObject(current)) return undefined;
    current = current[property];
  }

  return typeGuard(current) ? current : undefined;
}
