/**
 * TypeScript module augmentation for OpenAI SDK
 */

import { UsageMetadata } from "./index.js";

// Export something to make this a module (required for TypeScript compilation)
export {};

/**
 * OpenAI Chat Completions API augmentation
 *
 * Extends the OpenAI chat completions interfaces to include usageMetadata
 * for all completion types (base, streaming, and non-streaming).
 */
declare module "openai/resources/chat/completions/completions" {
  interface ChatCompletionCreateParamsBase {
    /**
     * Optional metadata for enhanced tracking and analytics.
     *
     * Provides rich context for business analytics, user tracking, and billing purposes.
     * All fields are optional to maintain backward compatibility and provide maximum flexibility.
     *
     * This metadata is automatically captured by the Revenium middleware and sent to
     * the Revenium API for detailed usage analytics and billing calculations.
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
declare module "openai/resources/embeddings" {
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
declare module "openai" {
  namespace Responses {
    interface ResponseCreateParams {
      /**
       * Custom usage metadata for Revenium tracking
       *
       * Enables comprehensive tracking and analytics for Responses API calls.
       * All fields are optional and can be customized based on your application needs.
       *
       * @see {@link UsageMetadata} for detailed field descriptions
       */
      usageMetadata?: UsageMetadata;
    }
  }
}
