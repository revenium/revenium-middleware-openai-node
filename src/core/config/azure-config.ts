/**
 * Azure Configuration Module
 *
 * Handles Azure-specific configuration logic.
 * Extracted from provider.ts for better separation of concerns.
 */

import { AzureConfig } from '../../types/index.js';
import { OpenAIClientInstance } from '../../types/function-parameters.js';
import { getLogger } from './manager.js';

// Global logger
const logger = getLogger();

/**
 * Gather Azure configuration from client and environment
 *
 * @param client - OpenAI/AzureOpenAI client instance
 * @returns AzureConfig object
 */
export function gatherAzureConfig(client: OpenAIClientInstance): AzureConfig {
  const config: AzureConfig = {};
  try {
    // Extract from client baseURL if available
    if (client?.baseURL) {
      const baseUrl =
        typeof client.baseURL === 'string' ? client.baseURL : client.baseURL?.toString();
      config.endpoint = baseUrl;
    }

    // Extract from environment variables
    if (process.env.AZURE_OPENAI_ENDPOINT) {
      config.endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    }

    if (process.env.AZURE_OPENAI_DEPLOYMENT) {
      config.deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
    }

    if (process.env.AZURE_OPENAI_API_VERSION) {
      config.apiVersion = process.env.AZURE_OPENAI_API_VERSION;
    } else {
      // Default to preferred API version from Python learnings
      config.apiVersion = '2024-12-01-preview';
    }

    if (process.env.AZURE_OPENAI_API_KEY) {
      config.apiKey = process.env.AZURE_OPENAI_API_KEY;
    }

    if (process.env.AZURE_OPENAI_TENANT_ID) {
      config.tenantId = process.env.AZURE_OPENAI_TENANT_ID;
    }

    if (process.env.AZURE_OPENAI_RESOURCE_GROUP) {
      config.resourceGroup = process.env.AZURE_OPENAI_RESOURCE_GROUP;
    }

    logger.debug('Azure configuration gathered', {
      hasEndpoint: !!config.endpoint,
      hasDeployment: !!config.deployment,
      hasApiKey: !!config.apiKey,
      apiVersion: config.apiVersion,
    });
  } catch (error) {
    logger.warn('Error gathering Azure configuration', {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return config;
}
