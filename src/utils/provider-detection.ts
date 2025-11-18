/**
 * Provider Detection Utilities
 *
 * Simplifies complex provider detection logic using strategy pattern
 * instead of nested conditionals.
 */

import { Provider, ProviderInfo, AzureConfig } from "../types/index.js";
import { OpenAIClientInstance } from "../types/function-parameters.js";
import { Logger } from "../types/index.js";

/**
 * Provider detection strategy interface
 */
interface ProviderDetectionStrategy {
  /** Strategy name for logging */
  name: string;
  /** Priority (higher = checked first) */
  priority: number;
  /** Detection function */
  detect: (client: OpenAIClientInstance) => boolean;
  /** Additional context for logging */
  getContext?: (client: OpenAIClientInstance) => Record<string, unknown>;
}

/**
 * Provider detection strategies in priority order
 */
const DETECTION_STRATEGIES: ProviderDetectionStrategy[] = [
  {
    name: "Constructor Name",
    priority: 100,
    detect: (client) => {
      return client?.constructor?.name?.includes("Azure") || false;
    },
    getContext: (client) => ({
      constructorName: client?.constructor?.name,
    }),
  },
  {
    name: "Base URL",
    priority: 90,
    detect: (client) => {
      const baseUrl = getBaseUrlString(client);
      return baseUrl?.toLowerCase().includes("azure") || false;
    },
    getContext: (client) => ({
      baseURL: getBaseUrlString(client),
    }),
  },
  {
    name: "Environment Variables",
    priority: 80,
    detect: (client) => {
      // Only use env vars if not explicitly OpenAI
      const baseUrl = getBaseUrlString(client);
      const isExplicitlyOpenAI =
        baseUrl?.includes("api.openai.com") ||
        (client?.constructor?.name?.toLowerCase().includes("openai") &&
          !client?.constructor?.name?.toLowerCase().includes("azure"));

      return !isExplicitlyOpenAI && !!process.env.AZURE_OPENAI_ENDPOINT;
    },
    getContext: () => ({
      hasAzureEndpoint: !!process.env.AZURE_OPENAI_ENDPOINT,
      hasAzureApiKey: !!process.env.AZURE_OPENAI_API_KEY,
    }),
  },
];

/**
 * Extract base URL as string from client
 */
function getBaseUrlString(client: OpenAIClientInstance): string | undefined {
  if (!client?.baseURL) return undefined;

  return typeof client.baseURL === "string"
    ? client.baseURL
    : client.baseURL.toString();
}

/**
 * Detect provider using strategy pattern
 *
 * This replaces the complex nested conditional logic with a clean,
 * testable strategy pattern.
 *
 * @param client - OpenAI client instance
 * @param logger - Logger for debugging
 * @returns Provider detection result
 */
export function detectProviderStrategy(
  client: OpenAIClientInstance,
  logger?: Logger
): {
  provider: Provider;
  strategy?: string;
  context?: Record<string, unknown>;
} {
  // Sort strategies by priority (highest first)
  const sortedStrategies = [...DETECTION_STRATEGIES].sort(
    (a, b) => b.priority - a.priority
  );

  for (const strategy of sortedStrategies) {
    try {
      if (strategy.detect(client)) {
        const context = strategy.getContext?.(client) || {};

        if (logger) {
          logger.debug(`Azure provider detected via ${strategy.name}`, context);
        }

        return {
          provider: Provider.AZURE_OPENAI,
          strategy: strategy.name,
          context,
        };
      }
    } catch (error) {
      if (logger) {
        logger.warn(`Provider detection strategy '${strategy.name}' failed`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  // Default to OpenAI
  if (logger) {
    logger.debug(
      "Standard OpenAI provider detected (no Azure indicators found)"
    );
  }

  return { provider: Provider.OPENAI };
}

/**
 * Azure configuration gathering strategies
 */
interface AzureConfigStrategy {
  name: string;
  gather: (client: OpenAIClientInstance) => Partial<AzureConfig>;
}

const AZURE_CONFIG_STRATEGIES: AzureConfigStrategy[] = [
  {
    name: "Client BaseURL",
    gather: (client) => {
      const baseUrl = getBaseUrlString(client);
      return baseUrl ? { endpoint: baseUrl } : {};
    },
  },
  {
    name: "Environment Variables",
    gather: () => ({
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION,
      apiKey: process.env.AZURE_OPENAI_API_KEY,
    }),
  },
];

/**
 * Gather Azure configuration using strategy pattern
 *
 * @param client - OpenAI client instance
 * @param logger - Logger for debugging
 * @returns Merged Azure configuration
 */
export function gatherAzureConfigStrategy(
  client: OpenAIClientInstance,
  logger?: Logger
): AzureConfig {
  const config: AzureConfig = {};
  for (const strategy of AZURE_CONFIG_STRATEGIES) {
    try {
      const strategyConfig = strategy.gather(client);

      // Merge non-undefined values
      Object.entries(strategyConfig).forEach(([key, value]) => {
        if (value !== undefined && !(key in config)) {
          (config as any)[key] = value;
        }
      });
    } catch (error) {
      if (logger) {
        logger.warn(`Azure config strategy '${strategy.name}' failed`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  if (logger) {
    logger.debug("Azure configuration gathered", {
      hasEndpoint: !!config.endpoint,
      hasApiKey: !!config.apiKey,
      apiVersion: config.apiVersion,
    });
  }

  return config;
}

/**
 * Create complete provider info using strategies
 *
 * @param client - OpenAI client instance
 * @param logger - Logger for debugging
 * @returns Complete provider information
 */
export function createProviderInfo(
  client: OpenAIClientInstance,
  logger?: Logger
): ProviderInfo {
  const detection = detectProviderStrategy(client, logger);

  if (detection.provider === Provider.AZURE_OPENAI) {
    const azureConfig = gatherAzureConfigStrategy(client, logger);

    return {
      provider: detection.provider,
      isAzure: true,
      azureConfig,
    };
  }

  return {
    provider: detection.provider,
    isAzure: false,
    azureConfig: undefined,
  };
}

/**
 * Validate provider detection result
 *
 * @param providerInfo - Provider info to validate
 * @returns Validation result
 */
export function validateProviderInfo(providerInfo: ProviderInfo): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  if (providerInfo.isAzure) {
    if (!providerInfo.azureConfig) {
      warnings.push(
        "Azure provider detected but no Azure configuration available"
      );
    } else {
      if (!providerInfo.azureConfig.endpoint) {
        warnings.push("Azure configuration missing endpoint");
      }
      if (!providerInfo.azureConfig.apiKey) {
        warnings.push("Azure configuration missing API key");
      }
    }
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}
