/**
 * Providers module - Main exports
 *
 * This module provides a clean interface for provider detection and management,
 * separating concerns into focused sub-modules.
 */

// Re-export all provider functionality
export {
  detectProvider,
  detectProviderFromConfig,
  hasAzureConfig,
  validateAzureConfig,
  getProviderMetadata,
} from "./detector.js";

export { gatherAzureConfig } from "../config/azure-config.js";
