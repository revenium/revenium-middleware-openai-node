/**
 * Revenium OpenAI Middleware for TypeScript
 *
 * This middleware tracks OpenAI usage and sends metrics to Revenium.
 */

// Import type augmentations to extend OpenAI types with usageMetadata
import "./types/openai-augmentation.js";

/**
 * Core types for TypeScript developers using Revenium middleware
 *
 * These types provide comprehensive TypeScript support for the Revenium OpenAI middleware,
 * enabling type-safe configuration, usage tracking, and integration with OpenAI APIs.
 *
 * @public
 */
export type {
  /**
   * Configuration interface for Revenium middleware initialization
   *
   * Defines all required and optional settings for connecting to Revenium's
   * metering API and configuring middleware behavior.
   */
  ReveniumConfig,

  /**
   * Usage metadata structure for tracking AI API calls
   *
   * Comprehensive metadata interface that allows tracking of user context,
   * business information, and custom fields for detailed analytics and billing.
   * All fields are optional to provide maximum flexibility.
   */
  UsageMetadata,

  /**
   * Logger interface for custom logging implementations
   *
   * Standardized logging interface that allows custom logger integration
   * while maintaining consistent log levels and metadata support.

   */
  Logger,

  /**
   * Azure OpenAI configuration interface
   *
   * Specific configuration options for Azure OpenAI integration,
   * including endpoint, API version, and deployment settings.
   */
  AzureConfig,

  /**
   * AI provider enumeration
   *
   * Supported AI providers for automatic detection and routing.
   * Used internally for provider-specific handling and metrics.
   */
  Provider,

  /**
   * Provider information structure
   *
   * Detailed information about the detected AI provider, including
   * configuration details and Azure-specific settings when applicable.
   */
  ProviderInfo,
} from "./types";

// Note: ExtendedChatCompletionCreateParams and ExtendedEmbeddingCreateParams are no longer exported
// as they have been replaced with seamless TypeScript module augmentation. The usageMetadata field
// is now natively available on OpenAI's types without requiring additional imports.

/**
 * Main API
 */
export {
  Initialize,
  GetClient,
  IsInitialized,
  Reset,
  Configure,
} from "./core/client";

/**
 * Middleware classes
 */
export {
  ReveniumOpenAI,
  ChatInterface,
  CompletionsInterface,
  EmbeddingsInterface,
  ResponsesInterface,
  StreamingWrapper,
  ImagesInterface,
  AudioTranscriptionsInterface,
  AudioTranslationsInterface,
  AudioSpeechInterface,
} from "./core/middleware";

/**
 * Tracking functions (for advanced use cases)
 */
export {
  trackUsageAsync,
  trackEmbeddingsUsageAsync,
  trackImageUsageAsync,
  trackAudioUsageAsync,
} from "./core/tracking";

/**
 * Provider detection functions
 */
export {
  detectProvider,
  hasAzureConfig,
  validateAzureConfig,
  getProviderMetadata,
} from "./core/providers";
