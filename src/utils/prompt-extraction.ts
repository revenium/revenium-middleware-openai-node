import { UsageMetadata } from "../types/index.js";
import {
  OpenAIChatRequest,
  OpenAIChatResponse,
} from "../types/function-parameters.js";
import { getConfig } from "../core/config/index.js";

const DEFAULT_MAX_PROMPT_SIZE = 50000;
const CAPTURE_PROMPTS_DEFAULT = false;

export function getMaxPromptSize(): number {
  const config = getConfig();
  if (config?.maxPromptSize && config.maxPromptSize > 0) {
    return config.maxPromptSize;
  }

  const envValue = process.env.REVENIUM_MAX_PROMPT_SIZE;
  if (envValue) {
    const parsed = parseInt(envValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return DEFAULT_MAX_PROMPT_SIZE;
}

export interface PromptData {
  systemPrompt?: string;
  inputMessages?: string;
  outputResponse?: string;
  promptsTruncated: boolean;
}

interface ContentBlock {
  type: string;
  text?: string;
  image_url?: unknown;
}

type MessageContent = string | ContentBlock[];

interface ToolCall {
  function?: {
    name?: string;
  };
}

interface FunctionCall {
  name?: string;
}

function contentBlocksToString(blocks: ContentBlock[]): string {
  return blocks
    .map((block) => {
      if (block.type === "text" && block.text) {
        return block.text;
      }
      if (block.type === "image_url") {
        return "[IMAGE]";
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

interface MessageWithTools {
  tool_calls?: ToolCall[];
  function_call?: FunctionCall;
}

/**
 * Sanitizes common credential patterns from text.
 *
 * Redacts the following credential types:
 * - OpenAI keys: sk-*, sk-proj-*, sk-ant-* (20+ chars)
 * - Perplexity keys: pplx-* (20+ chars)
 * - AWS access keys: AKIA* (20 chars)
 * - GitHub tokens: ghp_*, ghs_* (36+ chars)
 * - JWT tokens: eyJ*.eyJ*.*
 * - Bearer tokens
 * - Generic API keys, tokens, passwords, secrets (8-20+ chars)
 *
 * LIMITATIONS:
 * - Shorter credentials may pass through unsanitized
 * - Length constraints balance security with false positive prevention
 */
export function sanitizeCredentials(text: string): string {
  const patterns = [
    {
      regex: /pplx-[a-zA-Z0-9_-]{20,}/g,
      replacement: "pplx-***REDACTED***",
    },
    {
      regex: /sk-proj-[a-zA-Z0-9_-]{48,}/g,
      replacement: "sk-proj-***REDACTED***",
    },
    {
      regex: /sk-ant-[a-zA-Z0-9_-]{20,}/g,
      replacement: "sk-ant-***REDACTED***",
    },
    { regex: /sk-[a-zA-Z0-9_-]{20,}/g, replacement: "sk-***REDACTED***" },
    {
      regex: /AKIA[A-Z0-9]{16}/g,
      replacement: "AKIA***REDACTED***",
    },
    {
      regex: /ghp_[a-zA-Z0-9]{36,}/g,
      replacement: "ghp_***REDACTED***",
    },
    {
      regex: /ghs_[a-zA-Z0-9]{36,}/g,
      replacement: "ghs_***REDACTED***",
    },
    {
      regex: /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
      replacement: "***REDACTED_JWT***",
    },
    {
      regex: /Bearer\s+[a-zA-Z0-9_\-.+\/=]+/gi,
      replacement: "Bearer ***REDACTED***",
    },
    {
      regex: /api[_-]?key["'\s:=]+[a-zA-Z0-9_\-.+\/=]{20,}/gi,
      replacement: "api_key: ***REDACTED***",
    },
    {
      regex: /token["'\s:=]+[a-zA-Z0-9_\-.+\/=]{20,}/gi,
      replacement: "token: ***REDACTED***",
    },
    {
      regex: /password["'\s:=]+["']?([^"'\s]{8,})["']?/gi,
      replacement: "password: ***REDACTED***",
    },
    {
      regex: /secret["'\s:=]+["']?([^"'\s]{8,})["']?/gi,
      replacement: "secret: ***REDACTED***",
    },
  ];

  let sanitized = text;
  for (const pattern of patterns) {
    sanitized = sanitized.replace(pattern.regex, pattern.replacement);
  }
  return sanitized;
}

function truncateString(
  str: string | null | undefined,
  maxLength: number,
): { value: string; truncated: boolean } {
  if (!str || str.length === 0) {
    return { value: "", truncated: false };
  }

  const sanitized = sanitizeCredentials(str);

  if (sanitized.length <= maxLength) {
    return { value: sanitized, truncated: false };
  }
  return { value: sanitized.substring(0, maxLength), truncated: true };
}

function hasValidMessages(params: OpenAIChatRequest): boolean {
  return !!(params.messages && Array.isArray(params.messages));
}

function extractSystemPrompt(params: OpenAIChatRequest): string {
  if (!hasValidMessages(params)) {
    return "";
  }

  const systemMessages = params.messages
    .filter((msg) => msg.role === "system")
    .map((msg) => {
      const content = msg.content as MessageContent;
      if (typeof content === "string") {
        return content;
      }
      if (Array.isArray(content)) {
        return contentBlocksToString(content);
      }
      return "";
    })
    .filter(Boolean);

  return systemMessages.join("\n\n");
}

function extractInputMessages(params: OpenAIChatRequest): string {
  if (!hasValidMessages(params)) {
    return "";
  }

  return params.messages
    .filter((msg) => msg.role !== "system")
    .map((message) => {
      const role = message.role;
      let content = "";
      const msgContent = message.content as MessageContent;

      if (typeof msgContent === "string") {
        content = msgContent;
      } else if (Array.isArray(msgContent)) {
        content = contentBlocksToString(msgContent);
      }

      return `[${role}]\n${content}`;
    })
    .join("\n\n");
}

function extractOutputResponse(response: OpenAIChatResponse): string {
  if (!response.choices || response.choices.length === 0) {
    return "";
  }

  const choice = response.choices[0];
  const parts: string[] = [];

  if (choice.message?.content) {
    parts.push(choice.message.content);
  }

  if (choice.delta?.content) {
    parts.push(choice.delta.content);
  }

  const message = choice.message as MessageWithTools | undefined;
  if (message?.tool_calls && Array.isArray(message.tool_calls)) {
    message.tool_calls.forEach((toolCall) => {
      if (toolCall.function?.name) {
        parts.push(`[TOOL_USE: ${toolCall.function.name}]`);
      }
    });
  }

  if (message?.function_call?.name) {
    parts.push(`[FUNCTION_CALL: ${message.function_call.name}]`);
  }

  return parts.join("\n");
}

export function shouldCapturePrompts(metadata?: UsageMetadata): boolean {
  if (metadata?.capturePrompts !== undefined) {
    return metadata.capturePrompts;
  }

  const config = getConfig();
  if (config?.capturePrompts !== undefined) {
    return config.capturePrompts;
  }

  const envValue = process.env.REVENIUM_CAPTURE_PROMPTS;
  if (envValue !== undefined) {
    return envValue.toLowerCase() === "true";
  }

  return CAPTURE_PROMPTS_DEFAULT;
}

export function extractPrompts(
  params: OpenAIChatRequest,
  response: OpenAIChatResponse,
  metadata?: UsageMetadata,
): PromptData | null {
  if (!shouldCapturePrompts(metadata)) {
    return null;
  }

  const maxSize = getMaxPromptSize();
  let anyTruncated = false;

  const systemPromptRaw = extractSystemPrompt(params);
  const systemPromptResult = truncateString(systemPromptRaw, maxSize);
  anyTruncated = anyTruncated || systemPromptResult.truncated;

  const inputMessagesRaw = extractInputMessages(params);
  const inputMessagesResult = truncateString(inputMessagesRaw, maxSize);
  anyTruncated = anyTruncated || inputMessagesResult.truncated;

  const outputResponseRaw = extractOutputResponse(response);
  const outputResponseResult = truncateString(outputResponseRaw, maxSize);
  anyTruncated = anyTruncated || outputResponseResult.truncated;

  const hasAnyContent =
    systemPromptResult.value ||
    inputMessagesResult.value ||
    outputResponseResult.value;

  if (!hasAnyContent) {
    return null;
  }

  return {
    systemPrompt: systemPromptResult.value || undefined,
    inputMessages: inputMessagesResult.value || undefined,
    outputResponse: outputResponseResult.value || undefined,
    promptsTruncated: anyTruncated,
  };
}
