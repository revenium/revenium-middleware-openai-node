/**
 * Wrapper module - Main exports
 *
 * This module provides a clean interface for OpenAI client wrapping,
 * separating concerns into focused sub-modules.
 */

// Re-export all wrapper functionality
export { patchOpenAI, patchOpenAIInstance, getProviderInfo } from './instance-patcher.js';
