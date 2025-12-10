/**
 * Payload Builder Module
 *
 * Handles construction of Revenium API payloads.
 * Extracted from tracking.ts for single responsibility.
 */

import { randomUUID } from "crypto";
import { ReveniumPayload, ProviderInfo } from "../../types";
import {
  OpenAIChatResponse,
  OpenAIEmbeddingResponse,
  OpenAIChatRequest,
  OpenAIEmbeddingRequest,
} from "../../types/function-parameters.js";
import { getLogger } from "../config";
import { mapStopReason } from "../../utils/stop-reason-mapper.js";
import { buildMetadataFields } from "../../utils/metadata-builder.js";
import { getProviderMetadata } from "../providers";

// Global logger
const logger = getLogger();

/**
 * Build payload for Revenium API
 *
 * This shared payload builder eliminates payload duplication between
 * chat completions and embeddings. Handles both CHAT and EMBED operation types.
 *
 * @param operationType - Type of operation (CHAT or EMBED)
 * @param response - API response from OpenAI/Azure
 * @param request - Original request parameters
 * @param startTime - Request start timestamp
 * @param duration - Request duration in milliseconds
 * @param providerInfo - Provider information for Azure support
 * @returns Constructed payload for Revenium API
 */
export function buildPayload(
  operationType: "CHAT" | "EMBED",
  response: OpenAIChatResponse | OpenAIEmbeddingResponse,
  request: OpenAIChatRequest | OpenAIEmbeddingRequest,
  startTime: number,
  duration: number,
  providerInfo?: ProviderInfo
): ReveniumPayload {
  const now = new Date().toISOString();
  const requestTime = new Date(startTime).toISOString();
  const usage = response.usage;

  // For Azure, use the deployment name as-is
  // The deployment name is what the user provided and should be sent to Revenium
  const modelName = response.model;

  // Get provider metadata (fallback: OpenAI direct)
  const providerMetadata = providerInfo
    ? getProviderMetadata(providerInfo)
    : { provider: "OpenAI", modelSource: "OPENAI" };

  // Build metadata fields using utility (eliminates repetitive spreading)
  const metadataFields = buildMetadataFields(request.usageMetadata);

  // Common fields for all operations
  const commonPayload = {
    costType: "AI" as const,
    model: modelName, // Use model/deployment name as-is
    responseTime: now,
    requestDuration: duration,
    provider: providerMetadata.provider,
    modelSource: providerMetadata.modelSource,
    requestTime,
    completionStartTime: now,

    // Common token counts
    inputTokenCount: usage.prompt_tokens,
    totalTokenCount: usage.total_tokens,

    // Metadata fields (processed by utility)
    ...metadataFields,

    // Fixed middleware source identifier (spec format: revenium-{provider}-{language})
    middlewareSource: "revenium-openai-node",

    // Backend calculates costs
    inputTokenCost: undefined,
    outputTokenCost: undefined,
    totalCost: undefined,
  };

  // Operation-specific fields

  if (operationType !== "CHAT") {
    // For embeddings, we don't need the response cast since we use commonPayload
    return {
      ...commonPayload,
      operationType: "EMBED",
      transactionId: `embed-${randomUUID()}`,
      outputTokenCount: 0,
      // Embeddings don't support reasoning or caching
      reasoningTokenCount: undefined,
      cacheCreationTokenCount: undefined,
      cacheReadTokenCount: undefined,
      stopReason: "END",
      isStreamed: false,
      timeToFirstToken: undefined, // Not applicable for embeddings
    };
  }
  const chatResponse = response as OpenAIChatResponse;
  const chatUsage = chatResponse.usage;

  return {
    ...commonPayload,
    operationType: "CHAT",
    transactionId: chatResponse.id || `chat-${randomUUID()}`,
    outputTokenCount: chatUsage.completion_tokens || 0,
    // Leave null for models without reasoning capabilities (API spec)
    reasoningTokenCount: chatUsage.reasoning_tokens ?? undefined,
    // OpenAI doesn't report cache creation tokens
    cacheCreationTokenCount: undefined,
    // Only include if provider reports cache hits
    cacheReadTokenCount: chatUsage.cached_tokens ?? undefined,
    stopReason: mapStopReason(chatResponse.choices?.[0]?.finish_reason, logger),
    isStreamed: Boolean((request as OpenAIChatRequest).stream),
    // TODO: Implement real TTFB tracking for streaming requests
    timeToFirstToken: undefined,
  };
}

export function buildImagePayload(
  operationSubtype: "generation" | "edit" | "variation",
  response: any,
  request: any,
  startTime: number,
  duration: number,
  providerInfo?: ProviderInfo,
  usageMetadata?: any
): ReveniumPayload {
  const now = new Date().toISOString();
  const requestTime = new Date(startTime).toISOString();

  const providerMetadata = providerInfo
    ? getProviderMetadata(providerInfo)
    : { provider: "OpenAI", modelSource: "OPENAI" };

  const metadataFields = buildMetadataFields(usageMetadata);

  const attributes: any = {
    billing_unit: "per_image",
    operationSubtype,
    actual_image_count: response.data?.length || 0,
  };

  if (operationSubtype === "generation") {
    attributes.requested_image_count = request.n || 1;
    attributes.resolution = request.size || "1024x1024";
    attributes.quality = request.quality;
    attributes.style = request.style;
    attributes.response_format = request.response_format || "url";
    attributes.revised_prompt_provided =
      response.data?.[0]?.revised_prompt !== undefined;
  } else if (operationSubtype === "edit") {
    attributes.requested_image_count = request.n || 1;
    attributes.resolution = request.size || "1024x1024";
    attributes.response_format = request.response_format || "url";
    attributes.has_mask = request.mask !== undefined;
  } else if (operationSubtype === "variation") {
    attributes.requested_image_count = request.n || 1;
    attributes.resolution = request.size || "1024x1024";
    attributes.response_format = request.response_format || "url";
  }

  return {
    transactionId: `image-${operationSubtype}-${randomUUID()}`,
    operationType: "IMAGE",
    costType: "AI",
    model: request.model || "dall-e-2",
    provider: providerMetadata.provider,
    modelSource: providerMetadata.modelSource,
    middlewareSource: "revenium-openai-node",
    requestTime,
    responseTime: now,
    requestDuration: duration,
    completionStartTime: now,
    inputTokenCount: null,
    outputTokenCount: null,
    totalTokenCount: null,
    reasoningTokenCount: undefined,
    cacheCreationTokenCount: undefined,
    cacheReadTokenCount: undefined,
    stopReason: "END",
    isStreamed: false,
    timeToFirstToken: undefined,
    inputTokenCost: undefined,
    outputTokenCost: undefined,
    totalCost: undefined,
    ...metadataFields,
    requestedImageCount: request.n || 1,
    actualImageCount: response.data?.length || 0,
    attributes,
  };
}

export function buildAudioPayload(
  operationSubtype: "transcription" | "translation" | "speech_synthesis",
  response: any,
  request: any,
  startTime: number,
  duration: number,
  providerInfo?: ProviderInfo,
  usageMetadata?: any
): ReveniumPayload {
  const now = new Date().toISOString();
  const requestTime = new Date(startTime).toISOString();

  const providerMetadata = providerInfo
    ? getProviderMetadata(providerInfo)
    : { provider: "OpenAI", modelSource: "OPENAI" };

  const metadataFields = buildMetadataFields(usageMetadata);

  const attributes: any = {
    operationSubtype,
  };

  let durationSeconds: number | undefined;
  let characterCount: number | undefined;

  if (operationSubtype === "speech_synthesis") {
    attributes.billing_unit = "per_character";
    attributes.requested_character_count = request.input?.length || 0;
    attributes.voice = request.voice;
    attributes.speed = request.speed;
    attributes.response_format = request.response_format || "mp3";
    characterCount = request.input?.length || 0;
  } else {
    attributes.billing_unit = "per_minute";
    attributes.actual_duration_seconds = response.duration || 0;
    attributes.language = request.language || response.language;
    attributes.response_format = request.response_format || "json";
    attributes.temperature = request.temperature;
    durationSeconds = response.duration || 0;

    if (operationSubtype === "translation") {
      attributes.target_language = "en";
    }

    if (request.timestamp_granularities) {
      attributes.timestamp_granularities = request.timestamp_granularities;
    }
  }

  return {
    transactionId: `audio-${operationSubtype}-${randomUUID()}`,
    operationType: "AUDIO",
    costType: "AI",
    model: request.model || "whisper-1",
    provider: providerMetadata.provider,
    modelSource: providerMetadata.modelSource,
    middlewareSource: "revenium-openai-node",
    requestTime,
    responseTime: now,
    requestDuration: duration,
    completionStartTime: now,
    inputTokenCount: null,
    outputTokenCount: null,
    totalTokenCount: null,
    reasoningTokenCount: undefined,
    cacheCreationTokenCount: undefined,
    cacheReadTokenCount: undefined,
    stopReason: "END",
    isStreamed: false,
    timeToFirstToken: undefined,
    inputTokenCost: undefined,
    outputTokenCost: undefined,
    totalCost: undefined,
    ...metadataFields,
    durationSeconds,
    characterCount,
    attributes,
  };
}
