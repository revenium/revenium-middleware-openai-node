import { ToolEventPayload } from "../../types/tool-metering.js";
import { getConfig, getLogger } from "../config/index.js";
import { buildReveniumUrl } from "../../utils/url-builder.js";
import { DEFAULT_REVENIUM_BASE_URL } from "../../utils/constants.js";

const TOOL_EVENTS_ENDPOINT = "/tool/events";

export async function sendToolEvent(payload: ToolEventPayload): Promise<void> {
  const config = getConfig();
  const logger = getLogger();

  if (!config) {
    logger.warn("Revenium configuration not found, skipping tool event tracking");
    return;
  }

  const url = buildReveniumUrl(
    config.reveniumBaseUrl || DEFAULT_REVENIUM_BASE_URL,
    TOOL_EVENTS_ENDPOINT
  );

  logger.debug("Sending tool event to Revenium", {
    url,
    toolId: payload.toolId,
    transactionId: payload.transactionId,
    operation: payload.operation,
    durationMs: payload.durationMs,
    success: payload.success,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-api-key": config.reveniumApiKey,
    },
    body: JSON.stringify(payload),
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId));

  logger.debug("Tool event response", {
    status: response.status,
    statusText: response.statusText,
    transactionId: payload.transactionId,
    toolId: payload.toolId,
  });

  if (!response.ok) {
    const responseText = await response.text();
    logger.error("Tool event API error", {
      status: response.status,
      statusText: response.statusText,
      body: responseText,
      transactionId: payload.transactionId,
      toolId: payload.toolId,
    });
    throw new Error(`Revenium tool event API error: ${response.status} ${response.statusText}`);
  }

  logger.debug("Tool event sent successfully", {
    transactionId: payload.transactionId,
    toolId: payload.toolId,
  });
}
