import { getLogger } from '../core/config/index.js';
import { knownModels } from './constants.js';

/**
 * Azure Model Name Resolution Module
 *
 * This module maps Azure deployment names to LiteLLM-compatible model names for accurate pricing.
 * Based on learnings from the Python implementation, it uses heuristic pattern matching
 * with fallback strategies to ensure reliable model name resolution.
 *
 * Key patterns observed in real Azure deployments:
 * - "gpt-4o-2024-11-20" → "gpt-4o"
 * - "text-embedding-3-large" → "text-embedding-3-large" (exact match)
 * - "o4-mini" → "gpt-4o-mini"
 * - "gpt4o-prod" → "gpt-4o"
 * - "gpt-35-turbo-dev" → "gpt-3.5-turbo"
 */

/**
 * In-memory cache for resolved model names
 * Using Map for thread-safe operations in Node.js
 */
const modelNameCache = new Map<string, string>();

/**
 * Cache for failed resolution attempts to avoid repeated warnings
 */
const failedResolutionCache = new Set<string>();

// Global logger
const logger = getLogger();

/**
 * Resolve Azure deployment name to LiteLLM-compatible model name
 *
 * @param deploymentName - Azure deployment name
 * @param useCache - Whether to use cached results (default: true)
 * @returns LiteLLM-compatible model name
 */
export function resolveAzureModelName(deploymentName: string, useCache: boolean = true): string {
  if (!deploymentName) {
    logger.warn('Empty deployment name provided to model resolver');
    return deploymentName;
  }

  // Check cache first
  if (useCache && modelNameCache.has(deploymentName)) {
    const cachedResult = modelNameCache.get(deploymentName)!;
    logger.debug('Model name resolved from cache', {
      deployment: deploymentName,
      resolved: cachedResult,
    });
    return cachedResult;
  }

  try {
    const resolved = resolveModelNameHeuristic(deploymentName);

    // Cache the result
    if (useCache) {
      modelNameCache.set(deploymentName, resolved);
    }

    // Log successful resolution
    if (resolved !== deploymentName) {
      logger.debug('Model name resolved via heuristics', {
        deployment: deploymentName,
        resolved,
      });
    }

    return resolved;
  } catch (error) {
    logger.error('Error during model name resolution', {
      deployment: deploymentName,
      error: error instanceof Error ? error.message : String(error),
    });

    // Fallback to deployment name
    return deploymentName;
  }
}

/**
 * Heuristic pattern matching for Azure deployment names
 * Based on real-world patterns observed in the Python implementation
 *
 * @param deploymentName - Azure deployment name
 * @returns LiteLLM-compatible model name
 */
function resolveModelNameHeuristic(deploymentName: string): string {
  const nameLower = deploymentName.toLowerCase();

  // GPT-4o family - handle both "gpt-4o" and "o4" patterns
  if (/gpt-?4o/.test(nameLower) || /o4/.test(nameLower)) {
    if (/mini/.test(nameLower)) return 'gpt-4o-mini';
    return 'gpt-4o';
  }

  // GPT-4 family (non-omni)
  if (/gpt-?4(?!o)/.test(nameLower)) {
    if (/turbo/.test(nameLower)) return 'gpt-4-turbo';
    if (/vision/.test(nameLower) || /v/.test(nameLower)) return 'gpt-4-vision-preview';
    return 'gpt-4';
  }

  // GPT-3.5 family
  if (/gpt-?3\.?5/.test(nameLower) || /35-turbo/.test(nameLower) || /gpt-35/.test(nameLower)) {
    if (/instruct/.test(nameLower)) return 'gpt-3.5-turbo-instruct';
    return 'gpt-3.5-turbo';
  }

  // Embedding models - exact matches work well
  if (/embed/.test(nameLower)) {
    if (/text-embedding-3-large/.test(nameLower)) return 'text-embedding-3-large';
    if (/text-embedding-3-small/.test(nameLower)) return 'text-embedding-3-small';
    if (/text-embedding-ada-002/.test(nameLower) || /ada-002/.test(nameLower))
      return 'text-embedding-ada-002';
    if (/3-large/.test(nameLower)) return 'text-embedding-3-large';
    if (/3-small/.test(nameLower)) return 'text-embedding-3-small';
  }

  // Ada-002 pattern (can appear without "embed" in deployment name)
  if (/ada-002/.test(nameLower)) return 'text-embedding-ada-002';

  // DALL-E models
  if (/dall-?e/.test(nameLower)) {
    if (/3/.test(nameLower)) return 'dall-e-3';
    if (/2/.test(nameLower)) return 'dall-e-2';
  }

  // Whisper models
  if (/whisper/.test(nameLower)) return 'whisper-1';

  // TTS models
  if (/tts/.test(nameLower)) {
    if (/hd/.test(nameLower)) return 'tts-1-hd';
    return 'tts-1';
  }

  if (knownModels.includes(nameLower)) return nameLower;

  // No heuristic match found - log warning and use deployment name
  if (!failedResolutionCache.has(deploymentName)) {
    logger.warn(
      `⚠️ No heuristic match for Azure deployment: ${deploymentName}. Using deployment name for pricing. Consider adding pattern to azure-model-resolver.ts`
    );
    failedResolutionCache.add(deploymentName);
  }
  return deploymentName;
}

/**
 * Clear the model name cache
 * Useful for testing or when deployment configurations change
 */
export function clearModelNameCache(): void {
  modelNameCache.clear();
  failedResolutionCache.clear();
  getLogger().debug('Model name cache cleared');
}

/**
 * Get cache statistics for monitoring
 */
export function getModelNameCacheStats(): {
  cacheSize: number;
  failedResolutionCount: number;
  cacheEntries: Array<{ deployment: string; resolved: string }>;
} {
  return {
    cacheSize: modelNameCache.size,
    failedResolutionCount: failedResolutionCache.size,
    cacheEntries: Array.from(modelNameCache.entries()).map(([deployment, resolved]) => ({
      deployment,
      resolved,
    })),
  };
}

/**
 * Batch resolve multiple deployment names
 * Useful for pre-warming cache or bulk operations
 *
 * @param deploymentNames - Array of deployment names to resolve
 * @returns Map of deployment name to resolved model name
 */
export function batchResolveModelNames(deploymentNames: string[]): Map<string, string> {
  const results = new Map<string, string>();
  logger.debug('Batch resolving model names', {
    count: deploymentNames.length,
    deployments: deploymentNames,
  });

  for (const deployment of deploymentNames) {
    try {
      const resolved = resolveAzureModelName(deployment);
      results.set(deployment, resolved);
    } catch (error) {
      logger.error('Error in batch resolution', {
        deployment,
        error: error instanceof Error ? error.message : String(error),
      });
      results.set(deployment, deployment); // Fallback to original name
    }
  }
  return results;
}

/**
 * Check if a deployment name would be resolved to a different model name
 * Useful for validation and testing
 *
 * @param deploymentName - Azure deployment name
 * @returns true if the deployment name would be transformed
 */
export function wouldTransformDeploymentName(deploymentName: string): boolean {
  const resolved = resolveAzureModelName(deploymentName, false); // Don't use cache for this check
  return resolved !== deploymentName;
}
