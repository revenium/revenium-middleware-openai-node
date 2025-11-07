/**
 * Configuration module - Main exports
 *
 * This module provides a clean interface for configuration management,
 * separating concerns into focused sub-modules.
 */

// Re-export all configuration functionality
export { loadConfigFromEnv, loadAzureConfigFromEnv, hasAzureConfigInEnv } from './loader.js';

export { validateConfig, validateAzureConfig } from './validator.js';

export {
  getConfig,
  setConfig,
  getLogger,
  setLogger,
  initializeConfig,
  defaultLogger,
} from './manager.js';

// Export Azure-specific configuration
export * from './azure-config.js';
