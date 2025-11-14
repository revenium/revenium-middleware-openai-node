/**
 * Configuration Validator Module
 *
 * Handles validation of configuration objects.
 * Separated from loading and management for single responsibility.
 */

import { ReveniumConfig } from "../../types";

/**
 * Validate Revenium configuration
 */
export function validateConfig(config: ReveniumConfig): void {
  if (!config.reveniumApiKey) {
    throw new Error(
      "Revenium API key is required. Set REVENIUM_METERING_API_KEY environment variable or provide reveniumApiKey in config."
    );
  }

  if (!config.reveniumApiKey.startsWith("hak_")) {
    throw new Error(
      'Invalid Revenium API key format. Revenium API keys should start with "hak_"'
    );
  }

  if (!config.reveniumBaseUrl) {
    throw new Error(
      "Revenium base URL is missing. This should not happen as a default URL should be provided."
    );
  }

  // Validate URL format
  try {
    new URL(config.reveniumBaseUrl);
  } catch (error) {
    throw new Error(
      `Invalid Revenium base URL format: ${config.reveniumBaseUrl}`
    );
  }
}
