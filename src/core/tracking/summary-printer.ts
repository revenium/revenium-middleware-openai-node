/**
 * Summary Printer Module
 *
 * Provides terminal output for cost/metrics summary after API requests.
 * Fetches cost data from Revenium's traces API and formats for console display.
 */

import { ReveniumPayload, SummaryFormat } from "../../types";
import { getConfig, getLogger } from "../config";
import { DEFAULT_REVENIUM_BASE_URL } from "../../utils/constants.js";

const logger = getLogger();

/**
 * Response structure from Revenium completions metrics API
 */
interface CompletionMetrics {
  id?: string;
  transactionId?: string;
  model?: string;
  provider?: string;
  inputTokenCount?: number;
  outputTokenCount?: number;
  totalTokenCount?: number;
  inputTokenCost?: number;
  outputTokenCost?: number;
  totalCost?: number;
  requestDuration?: number;
}

interface CompletionsApiResponse {
  _embedded?: {
    aICompletionMetricResourceList?: CompletionMetrics[];
  };
}

function delayWithUnref(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    if (typeof timer.unref === "function") {
      timer.unref();
    }
  });
}

/**
 * Fetch metrics from Revenium completions API
 *
 * @param transactionId - The transaction ID to query
 * @param maxRetries - Maximum number of retry attempts
 * @param retryDelay - Milliseconds to wait between retries
 * @returns Completion metrics or null if unavailable
 */
async function fetchCompletionMetrics(
  transactionId: string,
  maxRetries: number = 3,
  retryDelay: number = 2000
): Promise<CompletionMetrics | null> {
  const config = getConfig();
  if (!config) {
    logger.debug("No config available for summary printing");
    return null;
  }

  if (!config.teamId) {
    logger.debug("Team ID not configured, skipping cost retrieval for summary");
    return null;
  }

  const baseUrl = (config.reveniumBaseUrl || DEFAULT_REVENIUM_BASE_URL).replace(
    /\/+$/,
    ""
  );
  // Note: profitstream API uses a different path structure than the metering API,
  // so we don't use buildReveniumUrl here (which adds /meter/v2 prefix)
  const url = `${baseUrl}/profitstream/v2/api/sources/metrics/ai/completions`;
  const urlWithParams = `${url}?teamId=${encodeURIComponent(
    config.teamId
  )}&transactionId=${encodeURIComponent(transactionId)}`;

  logger.debug("Fetching completion metrics", { url: urlWithParams });

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(urlWithParams, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "x-api-key": config.reveniumApiKey,
        },
      });

      if (!response.ok) {
        // Drain the response body to prevent resource leaks (matches cleanup pattern in sendToRevenium)
        try {
          await response.text();
        } catch {
          // Ignore errors when draining the body
        }
        logger.debug(`Completions metrics API returned ${response.status}`, {
          attempt: attempt + 1,
        });
        if (attempt < maxRetries - 1) {
          await delayWithUnref(retryDelay);
          continue;
        }
        return null;
      }

      const data = (await response.json()) as CompletionsApiResponse;
      const completions = data._embedded?.aICompletionMetricResourceList;

      if (completions && completions.length > 0) {
        return completions[0];
      }

      if (attempt < maxRetries - 1) {
        logger.debug(
          `Waiting for metrics to aggregate (attempt ${
            attempt + 1
          }/${maxRetries})...`
        );
        await delayWithUnref(retryDelay);
      }
    } catch (error) {
      logger.debug("Failed to fetch trace metrics", {
        error: error instanceof Error ? error.message : String(error),
        attempt: attempt + 1,
      });
      if (attempt < maxRetries - 1) {
        await delayWithUnref(retryDelay);
      }
    }
  }

  return null;
}

function isSummaryFormat(value: unknown): value is SummaryFormat {
  return value === "human" || value === "json";
}

interface JsonSummary {
  model: string;
  provider: string;
  durationSeconds: number;
  inputTokenCount: number | null;
  outputTokenCount: number | null;
  totalTokenCount: number | null;
  cost: number | null;
  costStatus?: "pending" | "unavailable";
  traceId?: string;
}

function formatAndPrintJsonSummary(
  payload: ReveniumPayload,
  metrics?: CompletionMetrics | null
): void {
  const config = getConfig();

  const summary: JsonSummary = {
    model: payload.model,
    provider: payload.provider,
    durationSeconds: payload.requestDuration / 1000,
    inputTokenCount: payload.inputTokenCount,
    outputTokenCount: payload.outputTokenCount,
    totalTokenCount: payload.totalTokenCount,
    cost: typeof metrics?.totalCost === "number" ? metrics.totalCost : null,
  };

  if (summary.cost === null) {
    summary.costStatus = config?.teamId ? "pending" : "unavailable";
  }

  if (payload.traceId) {
    summary.traceId = payload.traceId;
  }

  console.log(JSON.stringify(summary));
}

function formatAndPrintHumanSummary(
  payload: ReveniumPayload,
  metrics?: CompletionMetrics | null
): void {
  console.log("\n" + "=".repeat(60));
  console.log("📊 REVENIUM USAGE SUMMARY");
  console.log("=".repeat(60));

  console.log(`🤖 Model: ${payload.model}`);
  console.log(`🏢 Provider: ${payload.provider}`);
  console.log(`⏱️  Duration: ${(payload.requestDuration / 1000).toFixed(2)}s`);

  console.log("\n💬 Token Usage:");
  console.log(
    `   📥 Input Tokens:  ${(payload.inputTokenCount ?? 0).toLocaleString()}`
  );
  console.log(
    `   📤 Output Tokens: ${(payload.outputTokenCount ?? 0).toLocaleString()}`
  );
  console.log(
    `   📊 Total Tokens:  ${(payload.totalTokenCount ?? 0).toLocaleString()}`
  );

  if (typeof metrics?.totalCost === "number") {
    console.log(`\n💰 Cost: $${metrics.totalCost.toFixed(6)}`);
  } else {
    const config = getConfig();
    if (!config?.teamId) {
      console.log(`\n💰 Cost: Set REVENIUM_TEAM_ID in .env to see pricing`);
    } else {
      console.log(`\n💰 Cost: (pending aggregation)`);
    }
  }

  if (payload.traceId) {
    console.log(`\n🔖 Trace ID: ${payload.traceId}`);
  }

  console.log("=".repeat(60) + "\n");
}

function formatAndPrintSummary(
  payload: ReveniumPayload,
  metrics: CompletionMetrics | null | undefined,
  format: SummaryFormat
): void {
  if (format === "json") {
    formatAndPrintJsonSummary(payload, metrics);
  } else {
    formatAndPrintHumanSummary(payload, metrics);
  }
}

function safeFormatAndPrintSummary(
  payload: ReveniumPayload,
  metrics: CompletionMetrics | null | undefined,
  format: SummaryFormat
): void {
  try {
    formatAndPrintSummary(payload, metrics, format);
  } catch (error) {
    logger.debug("Failed to format and print summary", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function getSummaryFormat(
  value: boolean | SummaryFormat | undefined
): SummaryFormat | null {
  if (!value) return null;
  if (value === true) return "human";
  if (isSummaryFormat(value)) {
    return value;
  }
  return null;
}

export function printUsageSummary(payload: ReveniumPayload): void {
  const config = getConfig();
  const format = getSummaryFormat(config?.printSummary);

  if (!format) {
    return;
  }

  if (config?.teamId && payload.transactionId) {
    fetchCompletionMetrics(payload.transactionId)
      .then((metrics) => {
        safeFormatAndPrintSummary(payload, metrics, format);
      })
      .catch((error) => {
        logger.debug("Failed to print usage summary with metrics", {
          error: error instanceof Error ? error.message : String(error),
        });
        safeFormatAndPrintSummary(payload, null, format);
      })
      .catch(() => {
        // Final safety catch to prevent unhandled rejections
      });
  } else {
    safeFormatAndPrintSummary(payload, null, format);
  }
}
