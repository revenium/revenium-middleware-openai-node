/**
 * TypeScript module augmentation for OpenAI SDK
 *
 * This file extends OpenAI's existing types to include the usageMetadata field
 * through TypeScript's declaration merging feature. This provides seamless
 * integration with the OpenAI SDK, allowing developers to use usageMetadata
 * directly in OpenAI API calls without type casting or additional imports.
 *
 * The augmentation covers all major OpenAI API endpoints including:
 * - Chat completions (streaming and non-streaming)
 * - Embeddings
 * - Future API endpoints as they become available
 *
 * @fileoverview OpenAI SDK type augmentation for Revenium middleware
 * @author Revenium
 * @since 1.0.0
 *
 * @example Basic usage with chat completions
 * ```typescript
 * import '@revenium/openai';
 * import OpenAI from 'openai';
 *
 * const openai = new OpenAI();
 *
 * const response = await openai.chat.completions.create({
 *   model: 'gpt-4o-mini',
 *   messages: [{ role: 'user', content: 'Hello!' }],
 *   usageMetadata: {  // TypeScript recognizes this natively
 *     subscriber: {
 *       id: 'user-123',
 *       email: 'user@my-company.com'
 *     },
 *     organizationId: 'my-company',
 *     productId: 'chat-app',
 *     taskType: 'customer-support'
 *   }
 * });
 * ```
 *
 * @example Usage with embeddings
 * ```typescript
 * const embedding = await openai.embeddings.create({
 *   model: 'text-embedding-ada-002',
 *   input: 'Text to embed',
 *   usageMetadata: {
 *     subscriber: { id: 'user-456' },
 *     productId: 'search-engine',
 *     taskType: 'document-indexing'
 *   }
 * });
 * ```
 */

import { UsageMetadata } from './index.js';

// Export something to make this a module (required for TypeScript compilation)
export {};

/**
 * OpenAI Chat Completions API augmentation
 *
 * Extends the OpenAI chat completions interfaces to include usageMetadata
 * for all completion types (base, streaming, and non-streaming).
 */
declare module 'openai/resources/chat/completions/completions' {
  interface ChatCompletionCreateParamsBase {
    /**
     * Optional metadata for enhanced tracking and analytics.
     *
     * Provides rich context for business analytics, user tracking, and billing purposes.
     * All fields are optional to maintain backward compatibility and provide maximum flexibility.
     *
     * This metadata is automatically captured by the Revenium middleware and sent to
     * the Revenium API for detailed usage analytics and billing calculations.
     *
     * @since 1.0.0
     * @example Basic user tracking
     * ```typescript
     * usageMetadata: {
     *   subscriber: {
     *     id: 'user-123',
     *     email: 'user@my-company.com'
     *   },
     *   organizationId: 'my-company',
     *   productId: 'support-app'
     * }
     * ```
     *
     * @example Advanced tracking with quality metrics
     * ```typescript
     * usageMetadata: {
     *   subscriber: { id: 'user-456' },
     *   organizationId: 'enterprise-corp',
     *   productId: 'ai-assistant',
     *   taskType: 'customer-support',
     *   traceId: 'session-abc-123',
     *   responseQualityScore: 0.95,
     *   agent: 'support-bot-v2'
     * }
     * ```
     */
    usageMetadata?: UsageMetadata;
  }

  interface ChatCompletionCreateParamsNonStreaming {
    /**
     * Optional metadata for enhanced tracking and analytics.
     *
     * Provides rich context for business analytics, user tracking, and billing purposes.
     * Specifically for non-streaming chat completions where the full response is returned at once.
     *
     * @see {@link UsageMetadata} for detailed field descriptions
     */
    usageMetadata?: UsageMetadata;
  }

  interface ChatCompletionCreateParamsStreaming {
    /**
     * Optional metadata for enhanced tracking and analytics.
     *
     * Provides rich context for business analytics, user tracking, and billing purposes.
     * Specifically for streaming chat completions where the response is delivered incrementally.
     *
     * @see {@link UsageMetadata} for detailed field descriptions
     */
    usageMetadata?: UsageMetadata;
  }
}

/**
 * OpenAI Embeddings API augmentation
 *
 * Extends the OpenAI embeddings interface to include usageMetadata
 * for comprehensive tracking of embedding generation requests.
 */
declare module 'openai/resources/embeddings' {
  interface EmbeddingCreateParams {
    /**
     * Optional metadata for enhanced tracking and analytics.
     *
     * Provides rich context for business analytics, user tracking, and billing purposes
     * specifically for embedding generation requests. Particularly useful for tracking
     * vector database operations, search functionality, and document processing workflows.
     *
     * All fields are optional to maintain backward compatibility and provide maximum flexibility.
     *
     * @since 1.0.0
     * @example Document indexing workflow
     * ```typescript
     * usageMetadata: {
     *   subscriber: {
     *     id: 'user-123',
     *     email: 'user@my-company.com'
     *   },
     *   organizationId: 'my-company',
     *   productId: 'vector-search',
     *   taskType: 'document-indexing'
     * }
     * ```
     *
     * @example Semantic search application
     * ```typescript
     * usageMetadata: {
     *   subscriber: { id: 'user-456' },
     *   organizationId: 'enterprise-corp',
     *   productId: 'knowledge-base',
     *   taskType: 'semantic-search',
     *   traceId: 'search-session-789'
     * }
     * ```
     *
     * @see {@link UsageMetadata} for detailed field descriptions
     */
    usageMetadata?: UsageMetadata;
  }
}

/**
 * OpenAI Responses API augmentation
 *
 * Extends the new Responses API to support usageMetadata for comprehensive tracking.
 * The Responses API is OpenAI's new unified interface for agent-like applications.
 */
declare module 'openai' {
  namespace Responses {
    interface ResponseCreateParams {
      /**
       * Custom usage metadata for Revenium tracking
       *
       * Enables comprehensive tracking and analytics for Responses API calls.
       * All fields are optional and can be customized based on your application needs.
       *
       * @example Basic Responses API usage with metadata
       * ```typescript
       * const response = await openai.responses.create({
       *   model: 'gpt-4.1',
       *   input: 'Analyze this data and provide insights',
       *   usageMetadata: {
       *     subscriber: {
       *       id: 'analyst-123',
       *       email: 'analyst@company.com'
       *     },
       *     organizationId: 'data-corp',
       *     productId: 'analytics-platform',
       *     taskType: 'data-analysis',
       *     agent: 'responses-api-v1'
       *   }
       * });
       * ```
       *
       * @example Streaming Responses API with metadata
       * ```typescript
       * const stream = await openai.responses.create({
       *   model: 'gpt-4.1',
       *   input: [
       *     { role: 'user', content: 'Generate a detailed report' }
       *   ],
       *   stream: true,
       *   usageMetadata: {
       *     subscriber: { id: 'user-456' },
       *     taskType: 'report-generation',
       *     traceId: 'session-789'
       *   }
       * });
       * ```
       *
       * @see {@link UsageMetadata} for detailed field descriptions
       */
      usageMetadata?: UsageMetadata;
    }
  }
}
