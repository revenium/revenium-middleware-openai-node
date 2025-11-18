/**
 * Configuration Manager Module
 *
 * Handles global configuration state management and logging.
 * Separated from loading and validation for single responsibility.
 */

import { ReveniumConfig, Logger } from "../../types";
import {
  loadConfigFromEnv,
  loadAzureConfigFromEnv,
  hasAzureConfigInEnv,
} from "./loader.js";
import { validateConfig } from "./validator.js";

/**
 * Default console logger implementation
 */
export const defaultLogger: Logger = {
  debug: (message: string, ...args: unknown[]) => {
    // Check both config.debug and environment variable
    if (globalConfig?.debug || process.env.REVENIUM_DEBUG === "true") {
      console.debug(`[Revenium Debug] ${message}`, ...args);
    }
  },
  info: (message: string, ...args: unknown[]) => {
    console.info(`[Revenium] ${message}`, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`[Revenium Warning] ${message}`, ...args);
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`[Revenium Error] ${message}`, ...args);
  },
};

/**
 * Global configuration instance
 */
let globalConfig: ReveniumConfig | null = null;
let globalLogger: Logger = defaultLogger;

/**
 * Get the current global configuration
 */
export function getConfig(): ReveniumConfig | null {
  return globalConfig;
}

/**
 * Set the global configuration
 */
export function setConfig(config: ReveniumConfig): void {
  validateConfig(config);
  globalConfig = config;
  globalLogger.debug("Revenium configuration updated", {
    baseUrl: config.reveniumBaseUrl,
    hasApiKey: !!config.reveniumApiKey,
    hasOpenAIKey: !!config.openaiApiKey,
  });
}

/**
 * Get the current logger
 */
export function getLogger(): Logger {
  return globalLogger;
}

/**
 * Set a custom logger
 */
export function setLogger(logger: Logger): void {
  globalLogger = logger;
}

/**
 * Initialize configuration from environment variables
 */
export function initializeConfig(): boolean {
  const envConfig = loadConfigFromEnv();
  if (envConfig) {
    try {
      // Load Azure configuration if available
      const azureConfig = loadAzureConfigFromEnv();
      if (azureConfig) {
        (envConfig as any).azure = azureConfig;
        globalLogger.debug(
          "Azure OpenAI configuration loaded from environment"
        );
      }

      setConfig(envConfig);
      globalLogger.debug(
        "Revenium middleware initialized from environment variables"
      );

      // Log Azure config availability for debugging
      if (hasAzureConfigInEnv()) {
        globalLogger.debug(
          "Azure OpenAI configuration detected in environment"
        );
      }

      return true;
    } catch (error) {
      globalLogger.error("Failed to initialize Revenium configuration:", error);
      return false;
    }
  }
  return false;
}
