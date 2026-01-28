/**
 * Middleware Interfaces
 *
 * Provides interfaces for OpenAI operations.
 * Contains: ChatInterface, CompletionsInterface, EmbeddingsInterface, ResponsesInterface, StreamingWrapper
 */

import OpenAI from "openai";
import { randomUUID } from "crypto";
import { Config, UsageMetadata, ProviderInfo } from "../../types";
import { getLogger } from "../config";
import {
  trackUsageAsync,
  trackEmbeddingsUsageAsync,
  trackImageUsageAsync,
  trackAudioUsageAsync,
} from "../tracking";
import {
  ResponsesCreateParams,
  ResponsesResponse,
} from "../../types/responses-api.js";
import {
  shouldCapturePrompts,
  sanitizeCredentials,
  getMaxPromptSize,
} from "../../utils/prompt-extraction.js";

const logger = getLogger();

/**
 * StreamingWrapper - wraps OpenAI stream and tracks tokens
 */
export class StreamingWrapper
  implements AsyncIterable<OpenAI.ChatCompletionChunk>
{
  private stream: AsyncIterable<OpenAI.ChatCompletionChunk>;
  private config: Config;
  private providerInfo: ProviderInfo;
  private model: string;
  private metadata?: UsageMetadata;
  private startTime: number;
  private firstTokenTime?: number;
  private requestId: string;
  private usage: any = {};
  private messages: any[];
  private accumulatedContent: string = "";

  constructor(
    stream: AsyncIterable<OpenAI.ChatCompletionChunk>,
    config: Config,
    providerInfo: ProviderInfo,
    model: string,
    messages: any[],
    metadata?: UsageMetadata
  ) {
    this.stream = stream;
    this.config = config;
    this.providerInfo = providerInfo;
    this.model = model;
    this.messages = messages;
    this.metadata = metadata;
    this.startTime = Date.now();
    this.requestId = randomUUID();
  }

  private buildTrackingPayload(
    finishReason: string | null,
    timeToFirstToken?: number
  ) {
    return {
      requestId: this.requestId,
      model: this.model,
      promptTokens: this.usage.prompt_tokens || 0,
      completionTokens: this.usage.completion_tokens || 0,
      totalTokens: this.usage.total_tokens || 0,
      reasoningTokens: this.usage.completion_tokens_details?.reasoning_tokens,
      cachedTokens: this.usage.prompt_tokens_details?.cached_tokens,
      duration: Date.now() - this.startTime,
      finishReason,
      usageMetadata: this.metadata,
      isStreamed: true,
      timeToFirstToken,
      providerInfo: this.providerInfo,
      messages: this.messages,
      responseContent: this.accumulatedContent
        ? sanitizeCredentials(this.accumulatedContent)
        : undefined,
    };
  }

  async *[Symbol.asyncIterator](): AsyncIterator<OpenAI.ChatCompletionChunk> {
    let completed = false;
    try {
      for await (const chunk of this.stream) {
        // Record time to first token
        if (!this.firstTokenTime && chunk.choices[0]?.delta?.content) {
          this.firstTokenTime = Date.now();
        }

        // Accumulate content for prompt capture
        if (
          chunk.choices[0]?.delta?.content &&
          shouldCapturePrompts(this.metadata)
        ) {
          const maxSize = getMaxPromptSize();
          const remaining = maxSize - this.accumulatedContent.length;
          if (remaining > 0) {
            this.accumulatedContent += chunk.choices[0].delta.content.slice(
              0,
              remaining
            );
          }
        }

        // Accumulate usage data
        if (chunk.usage) {
          this.usage = chunk.usage;
        }

        // Get request ID from chunk
        if (chunk.id) {
          this.requestId = chunk.id;
        }

        yield chunk;
      }

      completed = true;

      // Stream completed - track usage
      const timeToFirstToken = this.firstTokenTime
        ? this.firstTokenTime - this.startTime
        : undefined;

      trackUsageAsync(this.buildTrackingPayload(null, timeToFirstToken));

      logger.debug("Streaming completed", {
        requestId: this.requestId,
        model: this.model,
        duration: Date.now() - this.startTime,
        timeToFirstToken,
      });
    } catch (error) {
      completed = true;

      // Track error
      trackUsageAsync(this.buildTrackingPayload("error"));

      logger.error("Streaming error", {
        error: error instanceof Error ? error.message : String(error),
        requestId: this.requestId,
      });

      throw error;
    } finally {
      if (!completed) {
        const timeToFirstToken = this.firstTokenTime
          ? this.firstTokenTime - this.startTime
          : undefined;

        trackUsageAsync(
          this.buildTrackingPayload("cancelled", timeToFirstToken)
        );

        logger.debug("Streaming cancelled", {
          requestId: this.requestId,
          model: this.model,
          duration: Date.now() - this.startTime,
        });
      }
    }
  }
}

/**
 * CompletionsInterface - handles chat completions
 */
export class CompletionsInterface {
  constructor(
    private client: OpenAI,
    private config: Config,
    private providerInfo: ProviderInfo
  ) {}

  /**
   * Create a non-streaming chat completion
   */
  async create(
    params: OpenAI.ChatCompletionCreateParamsNonStreaming,
    metadata?: UsageMetadata
  ): Promise<OpenAI.ChatCompletion> {
    const startTime = Date.now();
    const requestId = randomUUID();

    logger.debug("Creating chat completion", { model: params.model });

    try {
      const response = await this.client.chat.completions.create(params);
      const duration = Date.now() - startTime;

      // Track usage
      const responseContent = response.choices[0]?.message?.content;

      trackUsageAsync({
        requestId: response.id || requestId,
        model: response.model,
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
        reasoningTokens:
          response.usage?.completion_tokens_details?.reasoning_tokens,
        cachedTokens: response.usage?.prompt_tokens_details?.cached_tokens,
        duration,
        finishReason: response.choices[0]?.finish_reason || null,
        usageMetadata: metadata,
        isStreamed: false,
        providerInfo: this.providerInfo,
        messages: params.messages,
        responseContent:
          responseContent && shouldCapturePrompts(metadata)
            ? sanitizeCredentials(responseContent)
            : undefined,
      });

      logger.debug("Chat completion created", {
        requestId: response.id,
        model: response.model,
        duration,
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Track error
      trackUsageAsync({
        requestId,
        model: params.model,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        duration,
        finishReason: "error",
        usageMetadata: metadata,
        isStreamed: false,
        providerInfo: this.providerInfo,
        messages: params.messages,
      });

      logger.error("Chat completion failed", {
        error: error instanceof Error ? error.message : String(error),
        model: params.model,
        duration,
      });

      throw error;
    }
  }

  /**
   * Create a streaming chat completion
   */
  async createStreaming(
    params: OpenAI.ChatCompletionCreateParamsStreaming,
    metadata?: UsageMetadata
  ): Promise<StreamingWrapper> {
    logger.debug("Creating streaming completion", { model: params.model });

    // Ensure stream_options includes usage data
    const stream = await this.client.chat.completions.create({
      ...params,
      stream: true,
      stream_options: { include_usage: true },
    });

    return new StreamingWrapper(
      stream,
      this.config,
      this.providerInfo,
      params.model,
      params.messages,
      metadata
    );
  }
}

/**
 * ChatInterface - provides access to completions
 */
export class ChatInterface {
  constructor(
    private client: OpenAI,
    private config: Config,
    private providerInfo: ProviderInfo
  ) {}

  completions(): CompletionsInterface {
    return new CompletionsInterface(
      this.client,
      this.config,
      this.providerInfo
    );
  }
}

/**
 * EmbeddingsInterface - handles embeddings
 */
export class EmbeddingsInterface {
  constructor(
    private client: OpenAI,
    private config: Config,
    private providerInfo: ProviderInfo
  ) {}

  async create(
    params: OpenAI.EmbeddingCreateParams,
    metadata?: UsageMetadata
  ): Promise<OpenAI.CreateEmbeddingResponse> {
    const startTime = Date.now();
    const requestId = randomUUID();

    logger.debug("Creating embeddings", { model: params.model });

    try {
      const response = await this.client.embeddings.create(params);
      const duration = Date.now() - startTime;

      // Track embeddings usage
      trackEmbeddingsUsageAsync({
        transactionId: requestId,
        model: response.model,
        promptTokens: response.usage.prompt_tokens,
        totalTokens: response.usage.total_tokens,
        duration,
        usageMetadata: metadata,
        requestStartTime: startTime,
        providerInfo: this.providerInfo,
      });

      logger.debug("Embeddings created", {
        requestId,
        model: response.model,
        duration,
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error("Embeddings failed", {
        error: error instanceof Error ? error.message : String(error),
        model: params.model,
        duration,
      });

      throw error;
    }
  }
}

/**
 * ResponsesInterface - handles Responses API (stateful API)
 */
export class ResponsesInterface {
  constructor(
    private client: OpenAI,
    private config: Config,
    private providerInfo: ProviderInfo
  ) {}

  async create(
    params: ResponsesCreateParams,
    metadata?: UsageMetadata
  ): Promise<ResponsesResponse> {
    const startTime = Date.now();
    const requestId = randomUUID();

    logger.debug("Creating response (Responses API)", { model: params.model });

    try {
      // Type assertion for Responses API (not yet in official types)
      const responsesAPI = (this.client as any).responses;

      if (!responsesAPI || !responsesAPI.create) {
        throw new Error(
          "Responses API not available in this OpenAI SDK version"
        );
      }

      const response = await responsesAPI.create(params);
      const duration = Date.now() - startTime;

      // Track usage (Responses API has different usage structure)
      const usage = (response as any).usage;
      if (usage) {
        const inputMessages = Array.isArray(params.input)
          ? params.input
          : [{ role: "user" as const, content: params.input }];

        trackUsageAsync({
          requestId: (response as any).id || requestId,
          model: (response as any).model || params.model,
          promptTokens: usage.input_tokens || 0,
          completionTokens: usage.output_tokens || 0,
          totalTokens: usage.total_tokens || 0,
          reasoningTokens: usage.reasoning_tokens,
          cachedTokens: usage.cached_tokens,
          duration,
          finishReason: (response as any).finish_reason || "completed",
          usageMetadata: metadata,
          isStreamed: false,
          providerInfo: this.providerInfo,
          messages: inputMessages,
          responseContent: (response as any).output || undefined,
        });
      }

      logger.debug("Response created (Responses API)", {
        requestId: (response as any).id,
        model: (response as any).model,
        duration,
      });

      return response as ResponsesResponse;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error("Responses API failed", {
        error: error instanceof Error ? error.message : String(error),
        model: params.model,
        duration,
      });

      throw error;
    }
  }

  async createStreaming(
    params: ResponsesCreateParams,
    metadata?: UsageMetadata
  ): Promise<AsyncIterable<any>> {
    const startTime = Date.now();
    const requestId = randomUUID();

    logger.debug("Creating streaming response (Responses API)", {
      model: params.model,
    });

    try {
      // Type assertion for Responses API (not yet in official types)
      const responsesAPI = (this.client as any).responses;

      if (!responsesAPI || !responsesAPI.create) {
        throw new Error(
          "Responses API not available in this OpenAI SDK version"
        );
      }

      // Ensure stream is enabled
      const streamParams = { ...params, stream: true };
      const stream = await responsesAPI.create(streamParams);

      // Wrap the stream to track usage
      const self = this;
      const wrappedStream = (async function* () {
        let fullContent = "";
        let finalResponse: any = null;

        for await (const chunk of stream) {
          // Accumulate content from text deltas
          if (chunk.type === "response.output_text.delta" && chunk.delta) {
            fullContent += chunk.delta;
          }

          // Capture final response with usage
          if (chunk.type === "response.completed" && chunk.response) {
            finalResponse = chunk.response;
          }

          yield chunk;
        }

        // Track final usage
        const duration = Date.now() - startTime;
        if (finalResponse?.usage) {
          const usage = finalResponse.usage;
          const inputMessages = Array.isArray(params.input)
            ? params.input
            : [{ role: "user" as const, content: params.input }];

          trackUsageAsync({
            requestId: finalResponse.id || requestId,
            model: finalResponse.model || params.model,
            promptTokens: usage.input_tokens || 0,
            completionTokens: usage.output_tokens || 0,
            totalTokens: usage.total_tokens || 0,
            reasoningTokens: usage.output_tokens_details?.reasoning_tokens,
            cachedTokens: usage.input_tokens_details?.cached_tokens,
            duration,
            finishReason: finalResponse.status || "completed",
            usageMetadata: metadata,
            isStreamed: true,
            providerInfo: self.providerInfo,
            messages: inputMessages,
            responseContent: fullContent,
          });
        }

        logger.debug("Streaming response completed (Responses API)", {
          requestId,
          model: params.model,
          duration,
        });
      })();

      return wrappedStream;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error("Responses API streaming failed", {
        error: error instanceof Error ? error.message : String(error),
        model: params.model,
        duration,
      });

      throw error;
    }
  }
}

async function wrapApiCall<T, P extends { model?: string | null }>(
  apiCall: () => Promise<T>,
  trackingCall: (
    response: T,
    duration: number,
    metadata?: UsageMetadata
  ) => Promise<void>,
  params: P,
  errorMessage: string
): Promise<T> {
  const startTime = Date.now();
  const { usageMetadata: metadata, ...cleanParams } = params as any;

  try {
    const response = await apiCall();
    const duration = Date.now() - startTime;
    await trackingCall(response, duration, metadata);
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(errorMessage, {
      error: error instanceof Error ? error.message : String(error),
      model: params.model,
      duration,
    });
    throw error;
  }
}

export class ImagesInterface {
  private originalImages: OpenAI.Images;
  private config: Config;
  private providerInfo: ProviderInfo;

  constructor(
    originalImages: OpenAI.Images,
    config: Config,
    providerInfo: ProviderInfo
  ) {
    this.originalImages = originalImages;
    this.config = config;
    this.providerInfo = providerInfo;
  }

  async generate(params: OpenAI.ImageGenerateParams): Promise<any> {
    const { usageMetadata: metadata, ...cleanParams } = params as any;
    const startTime = Date.now();

    return wrapApiCall(
      () => this.originalImages.generate(cleanParams),
      async (response, duration) => {
        await trackImageUsageAsync(
          "generation",
          response,
          params,
          startTime,
          duration,
          this.config,
          this.providerInfo,
          metadata
        );
      },
      params,
      "Image generation failed"
    );
  }

  async edit(params: OpenAI.ImageEditParams): Promise<any> {
    const { usageMetadata: metadata, ...cleanParams } = params as any;
    const startTime = Date.now();

    return wrapApiCall(
      () => this.originalImages.edit(cleanParams),
      async (response, duration) => {
        await trackImageUsageAsync(
          "edit",
          response,
          params,
          startTime,
          duration,
          this.config,
          this.providerInfo,
          metadata
        );
      },
      params,
      "Image edit failed"
    );
  }

  async createVariation(
    params: OpenAI.ImageCreateVariationParams
  ): Promise<any> {
    const { usageMetadata: metadata, ...cleanParams } = params as any;
    const startTime = Date.now();

    return wrapApiCall(
      () => this.originalImages.createVariation(cleanParams),
      async (response, duration) => {
        await trackImageUsageAsync(
          "variation",
          response,
          params,
          startTime,
          duration,
          this.config,
          this.providerInfo,
          metadata
        );
      },
      params,
      "Image variation failed"
    );
  }
}

export class AudioTranscriptionsInterface {
  private originalTranscriptions: OpenAI.Audio.Transcriptions;
  private config: Config;
  private providerInfo: ProviderInfo;

  constructor(
    originalTranscriptions: OpenAI.Audio.Transcriptions,
    config: Config,
    providerInfo: ProviderInfo
  ) {
    this.originalTranscriptions = originalTranscriptions;
    this.config = config;
    this.providerInfo = providerInfo;
  }

  async create(params: OpenAI.Audio.TranscriptionCreateParams): Promise<any> {
    const { usageMetadata: metadata, ...cleanParams } = params as any;
    const startTime = Date.now();

    return wrapApiCall(
      () => this.originalTranscriptions.create(cleanParams),
      async (response, duration) => {
        await trackAudioUsageAsync(
          "transcription",
          response,
          params,
          startTime,
          duration,
          this.config,
          this.providerInfo,
          metadata
        );
      },
      params,
      "Audio transcription failed"
    );
  }
}

export class AudioTranslationsInterface {
  private originalTranslations: OpenAI.Audio.Translations;
  private config: Config;
  private providerInfo: ProviderInfo;

  constructor(
    originalTranslations: OpenAI.Audio.Translations,
    config: Config,
    providerInfo: ProviderInfo
  ) {
    this.originalTranslations = originalTranslations;
    this.config = config;
    this.providerInfo = providerInfo;
  }

  async create(params: OpenAI.Audio.TranslationCreateParams): Promise<any> {
    const { usageMetadata: metadata, ...cleanParams } = params as any;
    const startTime = Date.now();

    return wrapApiCall(
      () => this.originalTranslations.create(cleanParams),
      async (response, duration) => {
        await trackAudioUsageAsync(
          "translation",
          response,
          params,
          startTime,
          duration,
          this.config,
          this.providerInfo,
          metadata
        );
      },
      params,
      "Audio translation failed"
    );
  }
}

export class AudioSpeechInterface {
  private originalSpeech: OpenAI.Audio.Speech;
  private config: Config;
  private providerInfo: ProviderInfo;

  constructor(
    originalSpeech: OpenAI.Audio.Speech,
    config: Config,
    providerInfo: ProviderInfo
  ) {
    this.originalSpeech = originalSpeech;
    this.config = config;
    this.providerInfo = providerInfo;
  }

  async create(params: OpenAI.Audio.SpeechCreateParams): Promise<any> {
    const { usageMetadata: metadata, ...cleanParams } = params as any;
    const startTime = Date.now();

    return wrapApiCall(
      () => this.originalSpeech.create(cleanParams),
      async (response, duration) => {
        await trackAudioUsageAsync(
          "speech_synthesis",
          response,
          params,
          startTime,
          duration,
          this.config,
          this.providerInfo,
          metadata
        );
      },
      params,
      "Audio speech synthesis failed"
    );
  }
}
