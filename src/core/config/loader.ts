/**
 * Configuration Loader Module
 *
 * Handles loading configuration from environment variables.
 * Separated from validation and management for single responsibility.
 */

import { ReveniumConfig, AzureConfig, SummaryFormat } from "../../types";
import { config as loadDotenv } from "dotenv";
import { existsSync } from "fs";
import { join } from "path";
import { DEFAULT_REVENIUM_BASE_URL } from "../../utils/constants.js";

/**
 * Parse REVENIUM_PRINT_SUMMARY environment variable value
 * @param value - The raw environment variable value
 * @returns boolean | SummaryFormat - false if disabled, 'human' or 'json' if enabled
 */
function parsePrintSummaryValue(
  value: string | undefined
): boolean | SummaryFormat {
  if (!value) return false;

  const normalized = value.toLowerCase().trim();

  if (normalized === "json") {
    return "json";
  }
  if (normalized === "human" || normalized === "true") {
    return "human";
  }

  return false;
}

/**
 * Flag to track if .env files have been loaded
 */
let envFilesLoaded = false;

/**
 * Load .env files automatically
 * Tries to load .env.local and .env files from current and parent directories
 */
function loadEnvFiles(): void {
  if (envFilesLoaded) return;

  const envFiles = [".env.local", ".env"];
  const cwd = process.cwd();
  const searchDirs = [cwd, join(cwd, "..")];

  for (const dir of searchDirs) {
    for (const envFile of envFiles) {
      const envPath = join(dir, envFile);
      if (existsSync(envPath)) {
        loadDotenv({ path: envPath });
      }
    }
  }

  envFilesLoaded = true;
}

/**
 * Load configuration from environment variables
 * Automatically loads .env files first
 */
export function loadConfigFromEnv(): ReveniumConfig | null {
  loadEnvFiles();

  const reveniumApiKey =
    process.env.REVENIUM_METERING_API_KEY || process.env.REVENIUM_API_KEY;
  const reveniumBaseUrl =
    process.env.REVENIUM_METERING_BASE_URL ||
    process.env.REVENIUM_BASE_URL ||
    DEFAULT_REVENIUM_BASE_URL;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const printSummary = parsePrintSummaryValue(
    process.env.REVENIUM_PRINT_SUMMARY
  );
  const teamId = process.env.REVENIUM_TEAM_ID;
  const capturePromptsEnv = process.env.REVENIUM_CAPTURE_PROMPTS;

  if (!reveniumApiKey) return null;

  const config: ReveniumConfig = {
    reveniumApiKey,
    reveniumBaseUrl,
    openaiApiKey,
    printSummary,
    teamId,
  };

  if (capturePromptsEnv !== undefined) {
    config.capturePrompts = capturePromptsEnv.toLowerCase() === "true";
  }

  return config;
}

/**
 * Load Azure configuration from environment variables
 * Automatically loads .env files first
 */
export function loadAzureConfigFromEnv(): AzureConfig | null {
  loadEnvFiles();

  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;

  // Return null if no Azure config is present
  if (!endpoint && !apiKey) return null;
  return {
    endpoint,
    apiVersion,
    apiKey,
  };
}

/**
 * Check if Azure configuration is available in environment
 */
export function hasAzureConfigInEnv(): boolean {
  return !!(
    process.env.AZURE_OPENAI_ENDPOINT || process.env.AZURE_OPENAI_API_KEY
  );
}
