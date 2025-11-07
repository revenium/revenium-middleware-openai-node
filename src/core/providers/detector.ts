/**
 * Provider Detection Module
 *
 * Handles detection of AI providers (OpenAI vs Azure OpenAI).
 * Extracted from provider.ts for better organization.
 */

import { Provider, ProviderInfo, AzureConfig } from '../../types/index.js';
import { OpenAIClientInstance } from '../../types/function-parameters.js';
import { isOpenAIClientInstance } from '../../utils/type-guards.js';
import { createProviderInfo, validateProviderInfo } from '../../utils/provider-detection.js';
import { getLogger } from '../config/index.js';

// Global logger
const logger = getLogger();

/**
 * Detect Azure OpenAI provider from client instance
 *
 * @param client - OpenAI or AzureOpenAI client instance
 * @returns ProviderInfo with detection results
 */
export function detectProvider(client: OpenAIClientInstance): ProviderInfo {
  // Validate client instance
  if (!isOpenAIClientInstance(client)) {
    logger.warn('Invalid OpenAI client instance provided to detectProvider');
    return {
      provider: Provider.OPENAI,
      isAzure: false,
      azureConfig: undefined,
    };
  }

  try {
    // Use strategy pattern for clean provider detection
    const providerInfo = createProviderInfo(client, logger);

    // Validate the result
    const validation = validateProviderInfo(providerInfo);
    if (validation.warnings.length > 0) {
      logger.warn('Provider detection completed with warnings', {
        warnings: validation.warnings,
      });
    }

    // Log final result
    if (providerInfo.isAzure) {
      logger.info('Azure OpenAI provider detected', {
        provider: providerInfo.provider,
        hasAzureConfig: !!providerInfo.azureConfig,
        endpoint: providerInfo.azureConfig?.endpoint ? '[REDACTED]' : undefined,
      });
    } else {
      logger.debug('Standard OpenAI provider detected');
    }

    return providerInfo;
  } catch (error) {
    logger.warn('Error during provider detection, defaulting to OpenAI', {
      error: error instanceof Error ? error.message : String(error),
    });

    // Default to OpenAI on any error
    return {
      provider: Provider.OPENAI,
      isAzure: false,
      azureConfig: undefined,
    };
  }
}

/**
 * Check if the current environment has Azure configuration
 * This is a lightweight check for lazy loading decisions
 *
 * @returns boolean indicating if Azure config is present
 */
export function hasAzureConfig(): boolean {
  return !!(
    process.env.AZURE_OPENAI_ENDPOINT ||
    process.env.AZURE_OPENAI_DEPLOYMENT ||
    process.env.AZURE_OPENAI_API_KEY
  );
}

/**
 * Validate Azure configuration completeness
 *
 * @param config - Azure configuration to validate
 * @returns validation result with missing fields
 */
export function validateAzureConfig(config: AzureConfig): {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
} {
  const missingFields: string[] = [];
  const warnings: string[] = [];

  // Required fields for basic Azure OpenAI operation
  if (!config.endpoint) {
    missingFields.push('endpoint');
  }

  if (!config.apiKey) {
    missingFields.push('apiKey');
  }

  // Optional but recommended fields
  if (!config.deployment) {
    warnings.push('deployment name not specified - may need to be included in model parameter');
  }

  if (!config.apiVersion) {
    warnings.push('API version not specified - using default 2024-12-01-preview');
  }

  // Validate endpoint format
  if (config.endpoint) {
    try {
      new URL(config.endpoint);
      if (!config.endpoint.toLowerCase().includes('azure')) {
        warnings.push(
          'endpoint does not contain "azure" - please verify this is an Azure OpenAI endpoint'
        );
      }
    } catch (error) {
      missingFields.push('valid endpoint URL');
    }
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
    warnings,
  };
}

/**
 * Get provider metadata for Revenium payload
 *
 * @param providerInfo - Provider detection result
 * @returns metadata object for Revenium
 */
export function getProviderMetadata(providerInfo: ProviderInfo): {
  provider: string;
  modelSource: string;
} {
  if (providerInfo.isAzure) {
    return {
      provider: 'Azure',
      modelSource: 'AZURE_OPENAI',
    };
  }
  return {
    provider: 'OpenAI',
    modelSource: 'OPENAI',  // Provider name when calling directly per spec
  };
}
