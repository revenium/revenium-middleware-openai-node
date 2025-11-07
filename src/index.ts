/**
 * Revenium OpenAI Middleware for TypeScript
 *
 * This middleware tracks OpenAI usage and sends metrics to Revenium.
 * Uses hybrid initialization: auto-initializes on import with graceful fallback to manual init.
 *
 * Environment Variables:
 * REVENIUM_METERING_API_KEY=hak_your_api_key
 * REVENIUM_METERING_BASE_URL=https://api.revenium.ai (optional)
 * OPENAI_API_KEY=sk_your_openai_key
 *
 * Simple Usage (auto-initialization):
 * import { patchOpenAIInstance } from '@revenium/openai';
 * import OpenAI from 'openai';
 *
 * const openai = patchOpenAIInstance(new OpenAI());
 * // Auto-initializes from environment variables
 *
 * Advanced Usage (explicit initialization):
 * import { initializeReveniumFromEnv, patchOpenAIInstance } from '@revenium/openai';
 * import OpenAI from 'openai';
 *
 * const result = initializeReveniumFromEnv();
 * if (!result.success) {
 *   throw new Error(result.message);
 * }
 * const openai = patchOpenAIInstance(new OpenAI());
 *
 * const response = await openai.chat.completions.create({
 *   model: 'gpt-4',
 *   messages: [{ role: 'user', content: 'Hello!' }],
 *   usageMetadata: {
 *     subscriber: {
 *       id: 'user-123',
 *       email: 'user@my-org.com'
 *     },
 *     organizationId: 'my-org',
 *     productId: 'my-app'
 *   }
 * });
 */

// Import type augmentations to extend OpenAI types with usageMetadata
import './types/openai-augmentation.js';

// Import from new modular structure
import {
  setConfig,
  validateConfig,
  initializeConfig,
  getConfig,
  getLogger,
} from './core/config/index.js';
import { patchOpenAI, patchOpenAIInstance } from './core/wrapper/index.js';
import type { ReveniumConfig } from './types/index.js';

// Track initialization state
let isInitialized = false;
let autoInitAttempted = false;

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
   *
   * @example
   * ```typescript
   * const config: ReveniumConfig = {
   *   reveniumApiKey: 'hak_your_api_key',
   *   reveniumBaseUrl: 'https://api.revenium.ai',
   *   debug: true
   * };
   * ```
   */
  ReveniumConfig,

  /**
   * Usage metadata structure for tracking AI API calls
   *
   * Comprehensive metadata interface that allows tracking of user context,
   * business information, and custom fields for detailed analytics and billing.
   * All fields are optional to provide maximum flexibility.
   *
   * @example
   * ```typescript
   * const metadata: UsageMetadata = {
   *   subscriber: { id: 'user-123', email: 'user@company.com' },
   *   organizationId: 'company-456',
   *   productId: 'chat-app',
   *   taskType: 'customer-support'
   * };
   * ```
   */
  UsageMetadata,

  /**
   * Logger interface for custom logging implementations
   *
   * Standardized logging interface that allows custom logger integration
   * while maintaining consistent log levels and metadata support.
   *
   * @example
   * ```typescript
   * const customLogger: Logger = {
   *   debug: (msg, meta) => console.debug(msg, meta),
   *   info: (msg, meta) => console.info(msg, meta),
   *   warn: (msg, meta) => console.warn(msg, meta),
   *   error: (msg, meta) => console.error(msg, meta)
   * };
   * ```
   */
  Logger,

  /**
   * Azure OpenAI configuration interface
   *
   * Specific configuration options for Azure OpenAI integration,
   * including endpoint, API version, and deployment settings.
   *
   * @example
   * ```typescript
   * const azureConfig: AzureConfig = {
   *   endpoint: 'https://your-resource.openai.azure.com',
   *   apiVersion: '2024-02-01',
   *   deployment: 'gpt-4'
   * };
   * ```
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
   *
   * @example
   * ```typescript
   * const providerInfo: ProviderInfo = {
   *   provider: Provider.AZURE_OPENAI,
   *   isAzure: true,
   *   endpoint: 'https://your-resource.openai.azure.com',
   *   deployment: 'gpt-4'
   * };
   * ```
   */
  ProviderInfo,
} from './types';

// Note: ExtendedChatCompletionCreateParams and ExtendedEmbeddingCreateParams are no longer exported
// as they have been replaced with seamless TypeScript module augmentation. The usageMetadata field
// is now natively available on OpenAI's types without requiring additional imports.

// Export tracking functions
export { trackUsageAsync, trackEmbeddingsUsageAsync } from './core/tracking/index.js';

// Export provider detection functions
export {
  detectProvider,
  hasAzureConfig,
  validateAzureConfig,
  getProviderMetadata,
} from './core/providers/index.js';
export { getProviderInfo } from './core/wrapper/index.js';

// Export Azure model resolution functions
export {
  resolveAzureModelName,
  clearModelNameCache,
  getModelNameCacheStats,
  batchResolveModelNames,
  wouldTransformDeploymentName,
} from './utils/azure-model-resolver.js';

// Global logger
const logger = getLogger();

/**
 * Initialize Revenium middleware with configuration
 */
export function initializeRevenium(config: ReveniumConfig): {
  success: boolean;
  message: string;
} {
  // Check if already initialized to prevent duplicate initialization
  if (isInitialized) {
    return {
      success: true,
      message: 'Revenium middleware already initialized',
    };
  }

  try {
    // Apply default base URL if not provided
    const configWithDefaults = {
      ...config,
      reveniumBaseUrl: config.reveniumBaseUrl || 'https://api.revenium.ai',
    };

    validateConfig(configWithDefaults);
    setConfig(configWithDefaults);

    // Mark as initialized
    isInitialized = true;

    // Patch OpenAI prototype methods
    patchOpenAI();

    return {
      success: true,
      message: 'Revenium middleware initialized successfully',
    };
  } catch (error) {
    isInitialized = false;
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown initialization error',
    };
  }
}

/**
 * Configure Revenium middleware manually
 * Alias for initializeRevenium() with a more intuitive name
 *
 * @param config - Revenium configuration object
 * @returns Initialization result with success status and message
 *
 * @example
 * ```typescript
 * import { configure } from '@revenium/openai';
 *
 * configure({
 *   reveniumApiKey: 'hak_your_api_key',
 *   reveniumBaseUrl: 'https://api.revenium.ai',
 * });
 * ```
 */
export function configure(config: ReveniumConfig): {
  success: boolean;
  message: string;
} {
  return initializeRevenium(config);
}

/**
 * Initialize Revenium middleware from environment variables
 */
export function initializeReveniumFromEnv(): {
  success: boolean;
  message: string;
} {
  // Check if already initialized to prevent duplicate initialization
  if (isInitialized) {
    return {
      success: true,
      message: 'Revenium middleware already initialized',
    };
  }

  const envSuccess = initializeConfig();

  if (!envSuccess) {
    isInitialized = false;
    return {
      success: false,
      message:
        'Failed to load configuration from environment variables. Check REVENIUM_METERING_API_KEY and REVENIUM_METERING_BASE_URL.',
    };
  }

  // Mark as initialized
  isInitialized = true;

  // Patch OpenAI prototype methods
  patchOpenAI();

  return {
    success: true,
    message: 'Revenium middleware initialized from environment',
  };
}

/**
 * Manually patch an OpenAI instance (for advanced use cases)
 */
export { patchOpenAIInstance } from './core/wrapper/index.js';

/**
 * Auto-initialization with graceful fallback
 * Attempts to initialize from environment variables on module load.
 * If it fails, logs a debug message but doesn't throw - allows manual configuration later.
 */
function attemptAutoInitialization(): void {
  if (autoInitAttempted || isInitialized) return;

  autoInitAttempted = true;
  try {
    const result = initializeReveniumFromEnv();
    if (result.success) {
      // Auto-init succeeded - log debug message
      logger.debug('Revenium middleware auto-initialized from environment variables');
    } else {
      // Auto-init failed - log debug message but don't throw
      logger.debug('Auto-initialization failed, manual initialization required:', result.message);
    }
  } catch (error) {
    // Unexpected error during auto-init - log but don't throw
    logger.debug(
      'Auto-initialization encountered error:',
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Check if middleware has been initialized
 */
export function isReveniumInitialized(): boolean {
  return isInitialized;
}

/**
 * Get detailed initialization status
 */
export function getInitializationStatus(): {
  initialized: boolean;
  hasConfig: boolean;
  hasApiKey: boolean;
  autoInitAttempted: boolean;
} {
  const config = getConfig();
  return {
    initialized: isInitialized,
    hasConfig: !!config,
    hasApiKey: !!config?.reveniumApiKey,
    autoInitAttempted,
  };
}

// Perform auto-initialization when module is imported
attemptAutoInitialization();
