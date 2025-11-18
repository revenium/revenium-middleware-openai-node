/**
 * Metadata Builder Utilities
 *
 * Centralized metadata handling to eliminate repetitive spreading
 * and provide consistent metadata processing across the codebase.
 */

import { UsageMetadata } from "../types";

/**
 * Metadata field configuration for conditional inclusion
 */
interface MetadataFieldConfig {
  /** Source field name in UsageMetadata */
  source: keyof UsageMetadata;
  /** Target field name in payload (defaults to source) */
  target?: string;
  /** Whether this field is required */
  required?: boolean;
  /** Custom transformation function */
  transform?: (value: unknown) => unknown;
}

/**
 * Metadata mapping configuration
 * Maps UsageMetadata fields to payload fields with optional transformations
 * Subscriber object is passed through directly without transformation
 */
const METADATA_FIELD_MAP: MetadataFieldConfig[] = [
  { source: "traceId" },
  { source: "taskType" },
  { source: "agent" },
  { source: "organizationId" },
  { source: "productId" },
  { source: "subscriber" }, // Pass through nested subscriber object directly
  { source: "subscriptionId" },
  {
    source: "responseQualityScore",
    transform: (value: unknown) => {
      // Ensure quality score is between 0.0 and 1.0 (API spec requirement)
      if (typeof value === "number") return Math.max(0, Math.min(1, value));
      return value;
    },
  },
];

/**
 * Build metadata object for payload inclusion
 *
 * This function eliminates the repetitive spreading pattern and provides
 * a clean, testable way to handle metadata transformation.
 * Subscriber object is passed through directly without transformation.
 *
 * @param usageMetadata - Source metadata from request
 * @returns Clean metadata object for payload
 */
export function buildMetadataFields(
  usageMetadata?: UsageMetadata
): Record<string, unknown> {
  if (!usageMetadata) return {};
  const result: Record<string, unknown> = {};

  // Process all metadata fields including nested subscriber object
  for (const config of METADATA_FIELD_MAP) {
    const value = usageMetadata[config.source];

    // Skip undefined values (but allow null, empty strings, objects, etc.)
    if (value === undefined) continue;

    // Apply transformation if configured
    const transformedValue = config.transform ? config.transform(value) : value;

    // Use target field name or default to source
    const targetField = config.target || config.source;

    result[targetField] = transformedValue;
  }
  return result;
}

/**
 * Validate metadata completeness for specific use cases
 *
 * @param usageMetadata - Metadata to validate
 * @param requiredFields - List of required field names
 * @returns Validation result
 */
export function validateMetadata(
  usageMetadata?: UsageMetadata,
  requiredFields: (keyof UsageMetadata)[] = []
): {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
} {
  const missingFields: string[] = [];
  const warnings: string[] = [];

  if (!usageMetadata && requiredFields.length > 0) {
    return {
      isValid: false,
      missingFields: requiredFields as string[],
      warnings: ["No metadata provided"],
    };
  }

  if (usageMetadata) {
    // Check required fields
    for (const field of requiredFields) {
      if (!usageMetadata[field]) missingFields.push(String(field));
    }

    // Check for common issues
    if (usageMetadata.responseQualityScore) {
      const score = usageMetadata.responseQualityScore;
      // API Spec: https://revenium.readme.io/reference/meter_ai_completion (responseQualityScore)
      // "typically on a 0.0-1.0 scale"
      if (typeof score !== "number" || score < 0 || score > 1) {
        warnings.push(
          "responseQualityScore should be a number between 0.0 and 1.0"
        );
      }
    }

    if (
      usageMetadata.subscriber?.email &&
      !usageMetadata.subscriber.email.includes("@")
    ) {
      warnings.push(
        "subscriber.email does not appear to be a valid email address"
      );
    }
  }
  return {
    isValid: missingFields.length === 0,
    missingFields,
    warnings,
  };
}

/**
 * Merge multiple metadata sources with priority
 *
 * @param sources - Metadata sources in priority order (first wins)
 * @returns Merged metadata object
 */
export function mergeMetadata(
  ...sources: (UsageMetadata | undefined)[]
): UsageMetadata {
  const result: UsageMetadata = {};

  // Process sources in reverse order so first source wins
  for (const source of sources.reverse()) {
    if (source) Object.assign(result, source);
  }
  return result;
}

/**
 * Extract metadata from request parameters safely
 *
 * @param params - Request parameters that might contain usageMetadata
 * @returns Extracted metadata and cleaned parameters
 */
export function extractMetadata<T extends Record<string, unknown>>(
  params: T & { usageMetadata?: UsageMetadata }
): {
  metadata: UsageMetadata | undefined;
  cleanParams: Omit<T, "usageMetadata">;
} {
  const { usageMetadata, ...cleanParams } = params;
  return {
    metadata: usageMetadata,
    cleanParams: cleanParams as Omit<T, "usageMetadata">,
  };
}

/**
 * Create a metadata context for consistent logging
 * Uses sanitization to protect PII (emails are masked)
 *
 * @param usageMetadata - Source metadata
 * @returns Logging context object with sanitized PII
 */
export function createLoggingContext(
  usageMetadata?: UsageMetadata
): Record<string, unknown> {
  if (!usageMetadata) return {};

  // Use sanitizer to protect PII in logs
  const sanitized = sanitizeMetadataForLogging(usageMetadata);
  const sanitizedSubscriber = sanitized.subscriber as {
    id?: string;
    email?: string;
    credential?: unknown;
  };

  return {
    traceId: usageMetadata.traceId,
    taskType: usageMetadata.taskType,
    subscriberId: usageMetadata.subscriber?.id,
    subscriberEmail: sanitizedSubscriber?.email, // ← Now masked: us***@example.com
    organizationId: usageMetadata.organizationId,
    productId: usageMetadata.productId,
    agent: usageMetadata.agent,
  };
}

/**
 * Sanitize metadata for logging (remove sensitive fields)
 *
 * @param usageMetadata - Source metadata
 * @returns Sanitized metadata safe for logging
 */
export function sanitizeMetadataForLogging(
  usageMetadata?: UsageMetadata
): Record<string, unknown> {
  if (!usageMetadata) return {};

  // Create a copy and handle nested subscriber object
  const { subscriber, ...safeMetadata } = usageMetadata;

  const result: Record<string, unknown> = { ...safeMetadata };

  // Sanitize subscriber object if present
  if (subscriber) {
    const sanitizedSubscriber: Record<string, unknown> = {};

    if (subscriber.id) {
      sanitizedSubscriber.id = subscriber.id;
    }

    if (subscriber.email) {
      // Mask email: handles single-char emails (a@x.com → a***@x.com)
      sanitizedSubscriber.email = subscriber.email.replace(
        /(.{1,2}).*(@.*)/,
        "$1***$2"
      );
    }

    if (subscriber.credential) {
      sanitizedSubscriber.credential = {
        name: subscriber.credential.name,
        value: "[REDACTED]",
      };
    }
    result.subscriber = sanitizedSubscriber;
  }
  return result;
}
