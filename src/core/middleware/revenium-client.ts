/**
 * Revenium OpenAI Client
 *
 * Main client class that wraps OpenAI/AzureOpenAI and provides tracking.
 */

import OpenAI, { AzureOpenAI } from "openai";
import { Config, Provider, ProviderInfo } from "../../types";
import { getLogger } from "../config";
import {
  ChatInterface,
  EmbeddingsInterface,
  ResponsesInterface,
} from "./interfaces.js";

const logger = getLogger();

/**
 * ReveniumOpenAI - Main client class
 *
 * Provides API for OpenAI operations with automatic usage tracking.
 */
export class ReveniumOpenAI {
  private client: OpenAI | AzureOpenAI;
  private config: Config;
  private providerInfo: ProviderInfo;

  constructor(config: Config, provider: Provider) {
    this.config = config;

    // Create OpenAI or AzureOpenAI client based on provider
    if (provider === Provider.AZURE_OPENAI) {
      if (!config.azure) {
        throw new Error(
          "Azure configuration required for Azure OpenAI provider"
        );
      }

      logger.debug("Creating AzureOpenAI client", {
        endpoint: config.azure.endpoint,
        apiVersion: config.azure.apiVersion,
      });

      this.client = new AzureOpenAI({
        apiKey: config.azure.apiKey,
        endpoint: config.azure.endpoint,
        apiVersion: config.azure.apiVersion,
      });

      this.providerInfo = {
        provider: Provider.AZURE_OPENAI,
        isAzure: true,
        azureConfig: config.azure,
      };
    } else {
      logger.debug("Creating OpenAI client");

      this.client = new OpenAI({
        apiKey: config.openaiApiKey,
      });

      this.providerInfo = {
        provider: Provider.OPENAI,
        isAzure: false,
      };
    }

    logger.info("Revenium OpenAI client created", {
      provider: this.providerInfo.provider,
      isAzure: this.providerInfo.isAzure,
    });
  }

  /**
   * Get chat interface
   *
   * @returns ChatInterface for chat completions
   */
  chat(): ChatInterface {
    return new ChatInterface(this.client, this.config, this.providerInfo);
  }

  /**
   * Get embeddings interface
   *
   * @returns EmbeddingsInterface for embeddings
   */
  embeddings(): EmbeddingsInterface {
    return new EmbeddingsInterface(this.client, this.config, this.providerInfo);
  }

  /**
   * Get responses interface (Responses API)
   *
   * @returns ResponsesInterface for Responses API
   */
  responses(): ResponsesInterface {
    return new ResponsesInterface(this.client, this.config, this.providerInfo);
  }

  /**
   * Get the underlying OpenAI client
   *
   * For advanced use cases where direct access to OpenAI client is needed.
   * Note: Direct usage bypasses Revenium tracking.
   *
   * @returns The underlying OpenAI or AzureOpenAI client
   */
  getUnderlyingClient(): OpenAI | AzureOpenAI {
    return this.client;
  }

  /**
   * Get provider information
   * @returns Provider information for this client
   */
  getProviderInfo(): ProviderInfo {
    return this.providerInfo;
  }

  /**
   * Get configuration
   *
   * @returns Configuration for this client
   */
  getConfig(): Config {
    return this.config;
  }
}
