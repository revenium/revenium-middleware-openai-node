/**
 * Core Types Module
 *
 * Central type definitions for the Revenium OpenAI middleware.
 * This module exports all core types used throughout the application.
 */

// Re-export function parameter types
export * from "./function-parameters.js";

// Re-export Responses API types
export * from "./responses-api.js";

/**
 * Credential information for subscriber authentication
 *
 * Represents authentication credentials that can be attached to subscriber information
 * for enhanced security and tracking capabilities.
 */
export interface Credential {
  /** The name/type of the credential (e.g., 'api_token', 'session_id') */
  name: string;
  /** The credential value (should be handled securely) */
  value: string;
}

/**
 * Subscriber information for Revenium API
 *
 * Represents end-user information for tracking and billing purposes.
 * All fields are optional to provide maximum flexibility in implementation.
 */
export interface Subscriber {
  /** Unique identifier for the subscriber/user */
  id?: string;
  /** Email address of the subscriber */
  email?: string;
  /** Optional authentication credential for the subscriber */
  credential?: Credential;
}

/**
 * Usage metadata interface for tracking additional context
 *
 * Comprehensive metadata structure that enables detailed tracking of AI API usage
 * for analytics, billing, and business intelligence purposes. All fields are optional
 * to provide maximum flexibility while maintaining consistency across language implementations.
 */
export interface UsageMetadata {
  /** User identification information (nested structure for detailed tracking) */
  subscriber?: Subscriber;

  /** Customer organization name for multi-tenant applications (used for lookup/auto-creation) */
  organizationName?: string;
  /**
   * @deprecated Use organizationName instead. This field will be removed in a future version.
   * Organization or company identifier for multi-tenant applications
   */
  organizationId?: string;

  /** Product or feature name that is using AI services (used for lookup/auto-creation) */
  productName?: string;
  /**
   * @deprecated Use productName instead. This field will be removed in a future version.
   * Product or application identifier for usage segmentation
   */
  productId?: string;

  /** Subscription identifier for billing and plan management */
  subscriptionId?: string;

  /** Task type classification (e.g., 'chat', 'summarization', 'translation') */
  taskType?: string;
  /** Distributed tracing identifier for request tracking across services */
  traceId?: string;

  /** Quality score for response evaluation (0.0-1.0 scale per API spec) */
  responseQualityScore?: number;

  /** Agent or model variant identifier for A/B testing and performance tracking */
  agent?: string;

  /** Per-call override for prompt capture (overrides environment variable and config) */
  capturePrompts?: boolean;
}

/**
 * Provider information for tracking API source
 *
 * Detailed information about the detected AI provider, including configuration
 * details and Azure-specific settings when applicable. Used internally for
 * provider-specific handling and metrics collection.

 */
export interface ProviderInfo {
  /** The detected AI provider type */
  provider: Provider;
  /** Whether this is an Azure OpenAI instance */
  isAzure: boolean;
  /** API endpoint URL (for Azure OpenAI) */
  endpoint?: string;
  /** API version (for Azure OpenAI) */
  apiVersion?: string;
  /** Complete Azure configuration when available */
  azureConfig?: AzureConfig;
}

/**
 * Supported AI providers
 *
 * Enumeration of AI providers supported by the Revenium middleware.
 * Used for automatic detection, routing, and provider-specific handling.
 */
export enum Provider {
  /** Standard OpenAI API */
  OPENAI = "OPENAI",
  /** Azure OpenAI Service */
  AZURE_OPENAI = "AZURE_OPENAI",
}

/**
 * Azure OpenAI configuration
 *
 * Configuration interface for Azure OpenAI Service integration.
 * Provides all necessary settings for connecting to Azure OpenAI endpoints
 * with proper authentication and resource identification.
 */
export interface AzureConfig {
  /** Azure OpenAI endpoint URL */
  endpoint?: string;
  /** Azure OpenAI API key */
  apiKey?: string;
  /** Azure OpenAI API version */
  apiVersion?: string;
}

/**
 * Summary output format options
 * - 'human': Human-readable formatted output with emojis (default when enabled)
 * - 'json': JSON formatted output for automation/parsing
 */
export type SummaryFormat = "human" | "json";

/**
 * Revenium configuration interface
 *
 * Main configuration interface for initializing the Revenium middleware.
 * Defines all required and optional settings for connecting to Revenium's
 * metering API and configuring middleware behavior.

 */
export interface ReveniumConfig {
  /** Revenium API key for authentication (required) */
  reveniumApiKey: string;
  /** Revenium API base URL (optional, defaults to https://api.revenium.ai) */
  reveniumBaseUrl?: string;
  /** Enable debug logging (optional, defaults to false) */
  debug?: boolean;
  /** Azure OpenAI configuration (optional, for Azure OpenAI usage) */
  azure?: AzureConfig;
  /** OpenAI API key (optional, can be set via environment variable) */
  openaiApiKey?: string;
  /**
   * Enable cost/metrics summary output to terminal after each API request.
   * - true or 'human': Human-readable format with emojis
   * - 'json': JSON format for automation
   * - false: Disabled (default)
   */
  printSummary?: boolean | SummaryFormat;
  /** Revenium team ID for fetching cost metrics from the API. If not provided, the summary will still be printed but without cost information. */
  teamId?: string;
  /** Whether to capture and send prompts to Revenium API (default: false) */
  capturePrompts?: boolean;
  /** Maximum size in characters for captured prompts before truncation (default: 50000). Note: uses JavaScript string length (UTF-16 code units), not byte count. */
  maxPromptSize?: number;
}

/**
 * Alias for ReveniumConfig for internal use
 * @public
 */
export type Config = ReveniumConfig;

/**
 * Logger interface for consistent logging
 *
 * Standardized logging interface that allows custom logger integration
 * while maintaining consistent log levels and metadata support throughout
 * the middleware. Supports both structured and string metadata.
 */
export interface Logger {
  /** Log debug-level messages with optional metadata */
  debug(message: string, meta?: Record<string, unknown> | string): void;
  /** Log info-level messages with optional metadata */
  info(message: string, meta?: Record<string, unknown> | string): void;
  /** Log warning-level messages with optional metadata */
  warn(message: string, meta?: Record<string, unknown> | string): void;
  /** Log error-level messages with optional metadata */
  error(
    message: string,
    meta?: Record<string, unknown> | string | unknown,
  ): void;
}

/**
 * Revenium API payload structure
 */
export interface ReveniumPayload {
  transactionId: string;
  operationType:
    | "CHAT"
    | "GENERATE"
    | "EMBED"
    | "CLASSIFY"
    | "SUMMARIZE"
    | "TRANSLATE"
    | "IMAGE"
    | "AUDIO"
    | "OTHER";
  costType: "AI";

  // Model and provider info
  model: string;
  provider: string;
  modelSource?: string;
  middlewareSource: string;

  // Timing information
  requestTime: string;
  responseTime: string;
  requestDuration: number;
  completionStartTime: string;

  inputTokenCount: number | null;
  outputTokenCount: number | null;
  totalTokenCount: number | null;
  reasoningTokenCount: number | undefined;
  cacheCreationTokenCount: number | undefined;
  cacheReadTokenCount: number | undefined;

  // Chat-specific fields
  stopReason: string;
  isStreamed: boolean;
  timeToFirstToken?: number | undefined; // Undefined when not tracking TTFB

  // Cost information (calculated by backend)
  inputTokenCost?: number;
  outputTokenCost?: number;
  totalCost?: number;

  traceId?: string;
  taskType?: string;
  agent?: string;
  organizationName?: string;
  productName?: string;
  subscriber?: Subscriber;
  subscriptionId?: string;
  responseQualityScore?: number;

  requestedImageCount?: number;
  actualImageCount?: number;
  durationSeconds?: number;
  characterCount?: number;
  inputAudioTokenCount?: number;
  outputAudioTokenCount?: number;

  attributes?: Record<string, unknown>;

  environment?: string;
  operationSubtype?: string;
  retryNumber?: number;
  parentTransactionId?: string;
  transactionName?: string;
  region?: string;
  credentialAlias?: string;
  traceType?: string;
  traceName?: string;
  systemPrompt?: string;
  inputMessages?: string;
  outputResponse?: string;
  promptsTruncated?: boolean;
}

export interface ImageAttributes {
  billing_unit: "per_image";
  requested_image_count?: number;
  actual_image_count: number;
  resolution: string;
  quality?: "standard" | "hd";
  operationSubtype: "generation" | "edit" | "variation";
  response_format?: "url" | "b64_json";
  style?: "vivid" | "natural";
  revised_prompt_provided?: boolean;
  has_mask?: boolean;
}

export interface AudioTranscriptionAttributes {
  billing_unit: "per_minute";
  actual_duration_seconds: number;
  operationSubtype: "transcription" | "translation";
  language?: string;
  target_language?: string;
  response_format?: string;
  temperature?: number;
  timestamp_granularities?: string[];
}

export interface AudioSpeechAttributes {
  billing_unit: "per_character";
  requested_character_count: number;
  operationSubtype: "speech_synthesis";
  voice: string;
  speed?: number;
  response_format?: string;
  audio_size_bytes?: number;
}

export type AudioAttributes =
  | AudioTranscriptionAttributes
  | AudioSpeechAttributes;
