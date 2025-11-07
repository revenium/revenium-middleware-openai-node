/**
 * Stop Reason Mapper Utilities
 *
 * Centralized stop reason mapping logic using lookup tables
 * instead of nested conditionals. Based on the good example
 * from the anthropic-node middleware.
 */

/**
 * Stop reason mapping configuration
 * Maps provider-specific stop reasons to Revenium's standardized set
 */
const STOP_REASON_MAP: Record<string, string> = {
  // OpenAI/Azure OpenAI stop reasons
  stop: 'END',
  function_call: 'END_SEQUENCE',
  tool_calls: 'END_SEQUENCE',
  timeout: 'TIMEOUT',
  length: 'TOKEN_LIMIT',
  max_tokens: 'TOKEN_LIMIT',
  cost_limit: 'COST_LIMIT',
  completion_limit: 'COMPLETION_LIMIT',
  content_filter: 'ERROR',
  error: 'ERROR',
  cancelled: 'CANCELLED',
  canceled: 'CANCELLED',  // Handle both spellings

  // Anthropic stop reasons (for consistency across middleware)
  end_turn: 'END',
  stop_sequence: 'END_SEQUENCE',
  tool_use: 'END_SEQUENCE',
};

/**
 * Default stop reason when mapping fails
 */
const DEFAULT_STOP_REASON = 'END';

/**
 * Map provider stop reasons to Revenium stop reasons
 *
 * This replaces the nested if/switch logic with a clean lookup table approach.
 * Based on the good example from the anthropic-node middleware.
 *
 * @param providerStopReason - Stop reason from the AI provider
 * @param logger - Optional logger for warnings about unknown reasons
 * @returns Standardized Revenium stop reason
 */
export function mapStopReason(
  providerStopReason: string | null | undefined,
  logger?: { warn: (message: string, ...args: any[]) => void }
): string {
  if (!providerStopReason) return DEFAULT_STOP_REASON;
  const normalizedReason = providerStopReason.toLowerCase();
  const mappedReason = STOP_REASON_MAP[normalizedReason];

  if (!mappedReason) {
    // Log warning for unknown stop reasons to help with future mapping
    logger?.warn(`Unknown stop reason: ${providerStopReason}, mapping to ${DEFAULT_STOP_REASON}`);
    return DEFAULT_STOP_REASON;
  }

  return mappedReason;
}

/**
 * Get all supported stop reasons for documentation/testing
 */
export function getSupportedStopReasons(): string[] {
  return Object.keys(STOP_REASON_MAP);
}

/**
 * Check if a stop reason is supported
 */
export function isStopReasonSupported(reason: string): boolean {
  return reason.toLowerCase() in STOP_REASON_MAP;
}
