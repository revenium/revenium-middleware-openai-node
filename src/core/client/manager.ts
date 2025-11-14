/**
 * Client Manager
 */

import { ReveniumOpenAI } from "../middleware/revenium-client.js";
import { Config } from "../../types";
import {
  initializeConfig,
  validateConfig,
  setConfig,
  getConfig,
} from "../config";
import { detectProviderFromConfig } from "../providers";
import { getLogger } from "../config";
import { DEFAULT_REVENIUM_BASE_URL } from "../../utils/constants.js";

// Global client singleton
let globalClient: ReveniumOpenAI | null = null;

// Global logger
const logger = getLogger();

/**
 * Initialize - Initialize Revenium client
 * Can be called with explicit config or will load from environment variables.
 * @param config - Optional configuration. If not provided, loads from environment.
 */
export function Initialize(config?: Partial<Config>): void {
  logger.debug("Initializing Revenium client");

  let finalConfig: Config;

  if (config) {
    // Merge provided config with defaults
    const defaultConfig = {
      reveniumBaseUrl: DEFAULT_REVENIUM_BASE_URL,
      debug: false,
    };

    finalConfig = {
      ...defaultConfig,
      ...config,
    } as Config;

    logger.debug("Using provided configuration");
  } else {
    // Load from environment variables
    const envLoaded = initializeConfig();

    if (!envLoaded) {
      throw new Error(
        "Failed to load configuration from environment variables. " +
          "Ensure REVENIUM_METERING_API_KEY and OPENAI_API_KEY are set, " +
          "or provide configuration explicitly to Initialize()."
      );
    }

    finalConfig = getConfig()!;
    logger.debug("Loaded configuration from environment");
  }

  // Validate configuration
  try {
    validateConfig(finalConfig);
  } catch (error) {
    logger.error("Configuration validation failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

  // Store config globally
  setConfig(finalConfig);

  // Detect provider from configuration
  const providerInfo = detectProviderFromConfig(finalConfig);
  logger.info("Detected provider", {
    provider: providerInfo.provider,
    isAzure: providerInfo.isAzure,
  });

  // Create global client
  globalClient = new ReveniumOpenAI(finalConfig, providerInfo.provider);

  logger.info("Revenium client initialized successfully");
}

/**
 * GetClient - Get the global Revenium client
 * @returns The global ReveniumOpenAI client
 * @throws Error if client is not initialized
 */
export function GetClient(): ReveniumOpenAI {
  if (!globalClient) {
    throw new Error(
      "Revenium client not initialized. Call Initialize() first.\n\n" +
        "Example:\n" +
        '  import { Initialize, GetClient } from "@revenium/openai";\n' +
        "  Initialize();\n" +
        "  const client = GetClient();"
    );
  }
  return globalClient;
}

/**
 * IsInitialized - Check if client is initialized
 * @returns true if client is initialized, false otherwise
 */
export function IsInitialized(): boolean {
  return globalClient !== null;
}

/**
 * Reset - Reset the global client
 */
export function Reset(): void {
  logger.debug("Resetting global client");
  globalClient = null;
}

/**
 * Configure - Alias for Initialize
 * @param config - Configuration object
 */
export function Configure(config: Partial<Config>): void {
  Initialize(config);
}
