/**
 * Tracking module - Main exports
 *
 * This module provides a clean interface for usage tracking,
 * separating concerns into focused sub-modules.
 */

// Re-export all tracking functionality
export { sendToRevenium } from "./api-client.js";

export {
  buildPayload,
  buildImagePayload,
  buildAudioPayload,
} from "./payload-builder.js";

export {
  sendReveniumMetrics,
  sendReveniumEmbeddingsMetrics,
  trackUsageAsync,
  trackEmbeddingsUsageAsync,
  trackImageUsageAsync,
  trackAudioUsageAsync,
} from "./usage-tracker.js";

// Export utility functions
export { mapStopReason } from "../../utils/stop-reason-mapper.js";
