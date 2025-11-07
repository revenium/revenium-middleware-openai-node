/**
 * Configuration Loader Module
 *
 * Handles loading configuration from environment variables.
 * Separated from validation and management for single responsibility.
 */

import { ReveniumConfig, AzureConfig } from '../../types/index.js';

/**
 * Default Revenium base URL for consistency with other middleware
 */
const DEFAULT_REVENIUM_BASE_URL = 'https://api.revenium.ai';

/**
 * Load configuration from environment variables
 */
export function loadConfigFromEnv(): ReveniumConfig | null {
  const reveniumApiKey = process.env.REVENIUM_METERING_API_KEY || process.env.REVENIUM_API_KEY;
  const reveniumBaseUrl =
    process.env.REVENIUM_METERING_BASE_URL ||
    process.env.REVENIUM_BASE_URL ||
    DEFAULT_REVENIUM_BASE_URL;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!reveniumApiKey) return null;
  return {
    reveniumApiKey,
    reveniumBaseUrl,
    openaiApiKey,
  };
}

/**
 * Load Azure configuration from environment variables
 */
export function loadAzureConfigFromEnv(): AzureConfig | null {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const tenantId = process.env.AZURE_OPENAI_TENANT_ID;
  const resourceGroup = process.env.AZURE_OPENAI_RESOURCE_GROUP;

  // Return null if no Azure config is present
  if (!endpoint && !deployment && !apiKey) return null;
  return {
    endpoint,
    deployment,
    apiVersion: apiVersion || '2024-12-01-preview', // Default from Python learnings
    apiKey,
    tenantId,
    resourceGroup,
  };
}

/**
 * Check if Azure configuration is available in environment
 */
export function hasAzureConfigInEnv(): boolean {
  return !!(
    process.env.AZURE_OPENAI_ENDPOINT ||
    process.env.AZURE_OPENAI_DEPLOYMENT ||
    process.env.AZURE_OPENAI_API_KEY
  );
}
