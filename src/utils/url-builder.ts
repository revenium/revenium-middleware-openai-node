/**
 * URL Builder Utilities
 *
 * Centralized URL construction logic to eliminate nested conditionals.
 * Replaces the complex URL building logic from tracking.ts.
 */

/**
 * Build Revenium API URL with proper path handling
 *
 * This function intelligently handles base URLs and ensures the correct path structure.
 * Logic:
 * - If URL has /meter/v2 → append endpoint as-is
 * - If URL has /meter only → append /v2 and endpoint
 * - If URL has neither → append /meter/v2 and endpoint
 *
 * Examples:
 * - 'https://api.revenium.ai' + '/ai/completions' → 'https://api.revenium.ai/meter/v2/ai/completions'
 * - 'https://api.revenium.ai/meter' + '/ai/completions' → 'https://api.revenium.ai/meter/v2/ai/completions'
 * - 'https://api.revenium.ai/meter/v2' + '/ai/completions' → 'https://api.revenium.ai/meter/v2/ai/completions'
 *
 * @param baseUrl - The base URL from configuration (may include /meter or /meter/v2)
 * @param endpoint - The API endpoint to append (e.g., '/ai/completions')
 * @returns Complete URL for the API call
 */
export function buildReveniumUrl(baseUrl: string, endpoint: string): string {
  // Normalize the base URL by removing trailing slashes
  let normalizedBase = baseUrl.replace(/\/+$/, '');

  // Check if /meter/v2 is already at the end
  const hasMeterV2AtEnd = /\/meter\/v2$/i.test(normalizedBase);
  if (hasMeterV2AtEnd) {
    // Already has /meter/v2, just append endpoint
    return `${normalizedBase}${endpoint}`;
  }

  // Check if /meter is at the end (but not /meter/v2)
  const hasMeterAtEnd = /\/meter$/i.test(normalizedBase);
  if (hasMeterAtEnd) {
    // Has /meter but not /v2, append /v2 and endpoint
    return `${normalizedBase}/v2${endpoint}`;
  }

  // Check if /v2 is at the end (without /meter)
  const hasV2AtEnd = /\/v2$/i.test(normalizedBase);
  if (hasV2AtEnd) {
    // Has /v2 but not /meter, append endpoint as-is
    return `${normalizedBase}${endpoint}`;
  }

  // Has neither /meter nor /v2, append /meter/v2 and endpoint
  return `${normalizedBase}/meter/v2${endpoint}`;
}

/**
 * Validate URL format
 *
 * @param url - URL to validate
 * @returns true if valid, false otherwise
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
