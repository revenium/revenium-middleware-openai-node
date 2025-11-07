/**
 * Core Types Module
 *
 * Central type definitions for the Revenium OpenAI middleware.
 * This module exports all core types used throughout the application.
 */

// Re-export function parameter types
export * from './function-parameters.js';

// Re-export Responses API types
export * from './responses-api.js';

/**
 * Credential information for subscriber authentication
 *
 * Represents authentication credentials that can be attached to subscriber information
 * for enhanced security and tracking capabilities.
 *
 * @public
 * @example
 * ```typescript
 * const credential: Credential = {
 *   name: 'api_token',
 *   value: 'user_token_abc123'
 * };
 * ```
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
 *
 * @public
 * @example
 * ```typescript
 * const subscriber: Subscriber = {
 *   id: 'user-12345',
 *   email: 'john.doe@company.com',
 *   credential: {
 *     name: 'session_token',
 *     value: 'abc123xyz'
 *   }
 * };
 * ```
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
 *
 * @public
 * @example
 * ```typescript
 * const metadata: UsageMetadata = {
 *   subscriber: {
 *     id: 'user-123',
 *     email: 'user@company.com'
 *   },
 *   organizationId: 'org-456',
 *   productId: 'chat-assistant',
 *   taskType: 'customer-support',
 *   traceId: 'trace-789',
 *   responseQualityScore: 0.95,  // 0.0-1.0 scale per API spec
 *   agent: 'support-bot-v2'
 * };
 * ```
 */
export interface UsageMetadata {
  /** User identification information (nested structure for detailed tracking) */
  subscriber?: Subscriber;

  /** Organization or company identifier for multi-tenant applications */
  organizationId?: string;
  /** Product or application identifier for usage segmentation */
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
}

/**
 * Provider information for tracking API source
 *
 * Detailed information about the detected AI provider, including configuration
 * details and Azure-specific settings when applicable. Used internally for
 * provider-specific handling and metrics collection.
 *
 * @public
 * @example
 * ```typescript
 * const providerInfo: ProviderInfo = {
 *   provider: Provider.AZURE_OPENAI,
 *   isAzure: true,
 *   endpoint: 'https://my-resource.openai.azure.com',
 *   apiVersion: '2024-02-01',
 *   deployment: 'gpt-4-turbo'
 * };
 * ```
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
  /** Deployment name (for Azure OpenAI) */
  deployment?: string;
  /** Complete Azure configuration when available */
  azureConfig?: AzureConfig;
}

/**
 * Supported AI providers
 *
 * Enumeration of AI providers supported by the Revenium middleware.
 * Used for automatic detection, routing, and provider-specific handling.
 *
 * @public
 * @example
 * ```typescript
 * if (providerInfo.provider === Provider.AZURE_OPENAI) {
 *   console.log('Using Azure OpenAI');
 * }
 * ```
 */
export enum Provider {
  /** Standard OpenAI API */
  OPENAI = 'OPENAI',
  /** Azure OpenAI Service */
  AZURE_OPENAI = 'AZURE_OPENAI',
}

/**
 * Azure OpenAI configuration
 *
 * Configuration interface for Azure OpenAI Service integration.
 * Provides all necessary settings for connecting to Azure OpenAI endpoints
 * with proper authentication and resource identification.
 *
 * @public
 * @example
 * ```typescript
 * const azureConfig: AzureConfig = {
 *   endpoint: 'https://my-resource.openai.azure.com',
 *   apiKey: process.env.AZURE_OPENAI_API_KEY,
 *   apiVersion: '2024-02-01',
 *   deployment: 'gpt-4-turbo',
 *   tenantId: 'your-tenant-id'
 * };
 * ```
 */
export interface AzureConfig {
  /** Azure OpenAI endpoint URL */
  endpoint?: string;
  /** Azure OpenAI API key */
  apiKey?: string;
  /** Azure OpenAI API version */
  apiVersion?: string;
  /** Azure OpenAI deployment name */
  deployment?: string;
  /** Azure tenant ID for authentication */
  tenantId?: string;
  /** Azure resource group name */
  resourceGroup?: string;
}

/**
 * Revenium configuration interface
 *
 * Main configuration interface for initializing the Revenium middleware.
 * Defines all required and optional settings for connecting to Revenium's
 * metering API and configuring middleware behavior.
 *
 * @public
 * @example
 * ```typescript
 * const config: ReveniumConfig = {
 *   reveniumApiKey: 'hak_your_revenium_api_key',
 *   reveniumBaseUrl: 'https://api.revenium.ai',
 *   debug: true,
 *   openaiApiKey: process.env.OPENAI_API_KEY
 * };
 * ```
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
}

/**
 * Logger interface for consistent logging
 *
 * Standardized logging interface that allows custom logger integration
 * while maintaining consistent log levels and metadata support throughout
 * the middleware. Supports both structured and string metadata.
 *
 * @public
 * @example
 * ```typescript
 * const customLogger: Logger = {
 *   debug: (msg, meta) => console.debug(`[DEBUG] ${msg}`, meta),
 *   info: (msg, meta) => console.info(`[INFO] ${msg}`, meta),
 *   warn: (msg, meta) => console.warn(`[WARN] ${msg}`, meta),
 *   error: (msg, meta) => console.error(`[ERROR] ${msg}`, meta)
 * };
 * ```
 */
export interface Logger {
  /** Log debug-level messages with optional metadata */
  debug(message: string, meta?: Record<string, unknown> | string): void;
  /** Log info-level messages with optional metadata */
  info(message: string, meta?: Record<string, unknown> | string): void;
  /** Log warning-level messages with optional metadata */
  warn(message: string, meta?: Record<string, unknown> | string): void;
  /** Log error-level messages with optional metadata */
  error(message: string, meta?: Record<string, unknown> | string | unknown): void;
}

/**
 * Revenium API payload structure
 */
export interface ReveniumPayload {
  // Core identification
  transactionId: string;
  operationType: 'CHAT' | 'GENERATE' | 'EMBED' | 'CLASSIFY' | 'SUMMARIZE' | 'TRANSLATE' | 'OTHER';
  costType: 'AI';

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

  // Token counts
  inputTokenCount: number;
  outputTokenCount: number;
  totalTokenCount: number;
  // API Spec: https://revenium.readme.io/reference/meter_ai_completion
  // "Leave null for models without reasoning capabilities" - NOT in required fields
  reasoningTokenCount: number | undefined;
  cacheCreationTokenCount: number | undefined;  // Undefined when provider doesn't report
  cacheReadTokenCount: number | undefined;      // Undefined when provider doesn't report

  // Chat-specific fields
  stopReason: string;
  isStreamed: boolean;
  timeToFirstToken?: number | undefined;  // Undefined when not tracking TTFB

  // Cost information (calculated by backend)
  inputTokenCost?: number;
  outputTokenCost?: number;
  totalCost?: number;

  // Metadata fields (optional)
  traceId?: string;
  taskType?: string;
  agent?: string;
  organizationId?: string;
  productId?: string;
  subscriber?: Subscriber;
  subscriptionId?: string;
  responseQualityScore?: number;
}
