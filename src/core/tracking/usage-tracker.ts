/**
 * Usage Tracker Module
 *
 * High-level tracking functions that combine payload building and API communication.
 * Extracted from tracking.ts for better organization.
 */

import { UsageMetadata, ProviderInfo } from "../../types";
import {
  OpenAIChatResponse,
  OpenAIEmbeddingResponse,
  OpenAIChatRequest,
  OpenAIEmbeddingRequest,
} from "../../types/function-parameters.js";
import { getLogger } from "../config";
import { sendToRevenium } from "./api-client.js";
import { buildPayload } from "./payload-builder.js";
import { safeAsyncOperation } from "../../utils/error-handler.js";
import { printUsageSummary } from "./summary-printer.js";

// Global logger
const logger = getLogger();

/**
 * Chat completions tracking - now a thin wrapper with Azure support
 */
export async function sendReveniumMetrics(
  response: OpenAIChatResponse,
  request: OpenAIChatRequest,
  startTime: number,
  duration: number,
  providerInfo?: ProviderInfo
): Promise<void> {
  await safeAsyncOperation(
    async () => {
      const payload = await buildPayload(
        "CHAT",
        response,
        request,
        startTime,
        duration,
        providerInfo
      );
      try {
        await sendToRevenium(payload);
      } finally {
        // Print summary regardless of whether sendToRevenium succeeded or failed
        // This ensures local visibility even when tracking delivery fails
        printUsageSummary(payload);
      }
    },
    "Chat completion tracking",
    {
      logError: true,
      rethrow: false, // Don't rethrow to maintain fire-and-forget behavior
      messagePrefix: "Chat completion tracking failed: ",
    },
    logger
  );
}

/**
 * Embeddings tracking - now a thin wrapper with Azure support
 */
export async function sendReveniumEmbeddingsMetrics(
  response: OpenAIEmbeddingResponse,
  request: OpenAIEmbeddingRequest,
  startTime: number,
  duration: number,
  providerInfo?: ProviderInfo
): Promise<void> {
  await safeAsyncOperation(
    async () => {
      const payload = await buildPayload(
        "EMBED",
        response,
        request,
        startTime,
        duration,
        providerInfo
      );
      try {
        await sendToRevenium(payload);
      } finally {
        // Print summary regardless of whether sendToRevenium succeeded or failed
        // This ensures local visibility even when tracking delivery fails
        printUsageSummary(payload);
      }
    },
    "Embeddings tracking",
    {
      logError: true,
      rethrow: false, // Don't rethrow to maintain fire-and-forget behavior
      messagePrefix: "Embeddings tracking failed: ",
    },
    logger
  );
}

/**
 * Fire-and-forget wrapper for chat completions with Azure support
 */
export function trackUsageAsync(trackingData: {
  requestId: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  reasoningTokens?: number;
  cachedTokens?: number;
  duration: number;
  finishReason: string | null;
  usageMetadata?: UsageMetadata;
  isStreamed?: boolean;
  timeToFirstToken?: number;
  providerInfo?: ProviderInfo;
  messages?: any[];
  responseContent?: string;
}): void {
  const mockResponse = {
    id: trackingData.requestId,
    model: trackingData.model,
    usage: {
      prompt_tokens: trackingData.promptTokens,
      completion_tokens: trackingData.completionTokens,
      total_tokens: trackingData.totalTokens,
      ...(trackingData.reasoningTokens && {
        reasoning_tokens: trackingData.reasoningTokens,
      }),
      ...(trackingData.cachedTokens && {
        cached_tokens: trackingData.cachedTokens,
      }),
    },
    choices: [
      {
        finish_reason: trackingData.finishReason,
        ...(trackingData.responseContent && {
          message: { content: trackingData.responseContent, role: "assistant" },
        }),
      },
    ],
  };

  const mockRequest: OpenAIChatRequest = {
    model: trackingData.model,
    messages: trackingData.messages || [],
    usageMetadata: trackingData.usageMetadata,
    stream: trackingData.isStreamed,
  };

  const startTime = Date.now() - trackingData.duration;

  sendReveniumMetrics(
    mockResponse,
    mockRequest,
    startTime,
    trackingData.duration,
    trackingData.providerInfo
  )
    .then(() => {
      logger.debug("Usage tracking completed successfully", {
        requestId: trackingData.requestId,
        model: trackingData.model,
        totalTokens: trackingData.totalTokens,
        isStreamed: trackingData.isStreamed,
      });
    })
    .catch((error) => {
      logger.warn("Usage tracking failed", {
        error: error instanceof Error ? error.message : String(error),
        requestId: trackingData.requestId,
        model: trackingData.model,
      });
    });
}

/**
 * Fire-and-forget wrapper for embeddings with Azure support
 */
export function trackEmbeddingsUsageAsync(trackingData: {
  transactionId: string;
  model: string;
  promptTokens: number;
  totalTokens: number;
  duration: number;
  usageMetadata?: UsageMetadata;
  requestStartTime: number;
  providerInfo?: ProviderInfo;
}): void {
  const mockResponse: OpenAIEmbeddingResponse = {
    model: trackingData.model,
    usage: {
      prompt_tokens: trackingData.promptTokens,
      total_tokens: trackingData.totalTokens,
    },
    data: [], // Mock empty data array for type compliance
    object: "list",
  };

  const mockRequest: OpenAIEmbeddingRequest = {
    model: trackingData.model,
    input: "", // Mock empty input for type compliance
    usageMetadata: trackingData.usageMetadata,
  };

  sendReveniumEmbeddingsMetrics(
    mockResponse,
    mockRequest,
    trackingData.requestStartTime,
    trackingData.duration,
    trackingData.providerInfo
  )
    .then(() => {
      logger.debug("Embeddings tracking completed successfully", {
        transactionId: trackingData.transactionId,
      });
    })
    .catch((error) => {
      logger.warn("Embeddings tracking failed", {
        error: error instanceof Error ? error.message : String(error),
        transactionId: trackingData.transactionId,
      });
    });
}

export async function trackImageUsageAsync(
  operationSubtype: "generation" | "edit" | "variation",
  response: any,
  request: any,
  startTime: number,
  duration: number,
  config: any,
  providerInfo: ProviderInfo,
  metadata?: UsageMetadata
): Promise<void> {
  const trackingData = {
    transactionId: `image-${operationSubtype}-${Date.now()}`,
    operationSubtype,
    model: request.model || "dall-e-2",
    startTime,
    duration,
  };

  logger.debug("Starting image tracking", trackingData);

  Promise.resolve()
    .then(async () => {
      const { buildImagePayload } = await import("./payload-builder.js");
      const payload = buildImagePayload(
        operationSubtype,
        response,
        request,
        startTime,
        duration,
        providerInfo,
        metadata
      );
      try {
        await sendToRevenium(payload);
      } finally {
        // Print summary regardless of whether sendToRevenium succeeded or failed
        // This ensures local visibility even when tracking delivery fails
        printUsageSummary(payload);
      }
    })
    .then(() => {
      logger.debug("Image tracking completed successfully", {
        transactionId: trackingData.transactionId,
      });
    })
    .catch((error) => {
      logger.warn("Image tracking failed", {
        error: error instanceof Error ? error.message : String(error),
        transactionId: trackingData.transactionId,
      });
    });
}

export async function trackAudioUsageAsync(
  operationSubtype: "transcription" | "translation" | "speech_synthesis",
  response: any,
  request: any,
  startTime: number,
  duration: number,
  config: any,
  providerInfo: ProviderInfo,
  metadata?: UsageMetadata
): Promise<void> {
  const trackingData = {
    transactionId: `audio-${operationSubtype}-${Date.now()}`,
    operationSubtype,
    model: request.model || "whisper-1",
    startTime,
    duration,
  };

  logger.debug("Starting audio tracking", trackingData);

  Promise.resolve()
    .then(async () => {
      const { buildAudioPayload } = await import("./payload-builder.js");
      const payload = buildAudioPayload(
        operationSubtype,
        response,
        request,
        startTime,
        duration,
        providerInfo,
        metadata
      );
      try {
        await sendToRevenium(payload);
      } finally {
        // Print summary regardless of whether sendToRevenium succeeded or failed
        // This ensures local visibility even when tracking delivery fails
        printUsageSummary(payload);
      }
    })
    .then(() => {
      logger.debug("Audio tracking completed successfully", {
        transactionId: trackingData.transactionId,
      });
    })
    .catch((error) => {
      logger.warn("Audio tracking failed", {
        error: error instanceof Error ? error.message : String(error),
        transactionId: trackingData.transactionId,
      });
    });
}
