/**
 * Revenium API Client Module
 *
 * Handles HTTP communication with the Revenium API.
 * Extracted from tracking.ts for single responsibility.
 */

import { ReveniumPayload } from "../../types";
import { getConfig, getLogger } from "../config";
import { buildReveniumUrl } from "../../utils/url-builder.js";
import { DEFAULT_REVENIUM_BASE_URL } from "../../utils/constants";

// Global logger
const logger = getLogger();

/**
 * Send payload to Revenium API
 *
 * This is the shared HTTP function that eliminates all duplication
 * between chat completions and embeddings tracking.
 *
 * @param payload - The payload to send to Revenium
 */
export async function sendToRevenium(payload: ReveniumPayload): Promise<void> {
  const config = getConfig();
  if (!config)
    return logger.warn("Revenium configuration not found, skipping tracking");

  // Use the new URL builder utility instead of nested conditionals
  const url = buildReveniumUrl(
    config.reveniumBaseUrl || DEFAULT_REVENIUM_BASE_URL,
    "/ai/completions"
  );

  logger.debug("Sending Revenium API request", {
    url,
    operationType: payload.operationType,
    transactionId: payload.transactionId,
    model: payload.model,
    totalTokens: payload.totalTokenCount,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-api-key": config.reveniumApiKey,
    },
    body: JSON.stringify(payload),
  });

  logger.debug("Revenium API response", {
    status: response.status,
    statusText: response.statusText,
    transactionId: payload.transactionId,
    operationType: payload.operationType,
  });

  if (!response.ok) {
    const responseText = await response.text();
    logger.error("Revenium API error response", {
      status: response.status,
      statusText: response.statusText,
      body: responseText,
      transactionId: payload.transactionId,
      operationType: payload.operationType,
    });
    throw new Error(
      `Revenium API error: ${response.status} ${response.statusText} - ${responseText}`
    );
  }

  const responseBody = await response.text();
  logger.debug("Revenium tracking successful", {
    transactionId: payload.transactionId,
    operationType: payload.operationType,
    response: responseBody,
  });
}
