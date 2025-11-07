/**
 * Configuration Validator Module
 *
 * Handles validation of configuration objects.
 * Separated from loading and management for single responsibility.
 */

import { ReveniumConfig, AzureConfig } from '../../types/index.js';

/**
 * Validate Revenium configuration
 */
export function validateConfig(config: ReveniumConfig): void {
  if (!config.reveniumApiKey) {
    throw new Error(
      'Revenium API key is required. Set REVENIUM_METERING_API_KEY environment variable or provide reveniumApiKey in config.'
    );
  }

  if (!config.reveniumApiKey.startsWith('hak_')) {
    throw new Error('Invalid Revenium API key format. Revenium API keys should start with "hak_"');
  }

  if (!config.reveniumBaseUrl) {
    throw new Error(
      'Revenium base URL is missing. This should not happen as a default URL should be provided.'
    );
  }

  // Validate URL format
  try {
    new URL(config.reveniumBaseUrl);
  } catch (error) {
    throw new Error(`Invalid Revenium base URL format: ${config.reveniumBaseUrl}`);
  }
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
