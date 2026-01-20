# Revenium OpenAI Middleware for Node.js

[![npm version](https://img.shields.io/npm/v/@revenium/openai.svg)](https://www.npmjs.com/package/@revenium/openai)
[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green)](https://nodejs.org/)
[![Documentation](https://img.shields.io/badge/docs-revenium.io-blue)](https://docs.revenium.io)
[![Website](https://img.shields.io/badge/website-revenium.ai-blue)](https://www.revenium.ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Transparent TypeScript middleware for automatic Revenium usage tracking with OpenAI**

A professional-grade Node.js middleware that seamlessly integrates with OpenAI and Azure OpenAI to provide automatic usage tracking, billing analytics, and comprehensive metadata collection. Features native TypeScript support with zero type casting required and supports both Chat Completions API, Embeddings API, and Responses API.

**Go-aligned API for consistent cross-language development!**

## Features

- **Go-Aligned API** - Same `Initialize()`/`GetClient()` pattern as Go implementation
- **Seamless Integration** - Native TypeScript support, no type casting required
- **Optional Metadata** - Track users, organizations, and business context (all fields optional)
- **Multiple API Support** - Chat Completions, Embeddings, and Responses API
- **Azure OpenAI Support** - Full Azure OpenAI integration with automatic detection
- **Type Safety** - Complete TypeScript support with IntelliSense
- **Streaming Support** - Handles regular and streaming requests seamlessly
- **Fire-and-Forget** - Never blocks your application flow
- **Automatic .env Loading** - Loads environment variables automatically

## Getting Started

### 1. Create Project Directory

```bash
# Create project directory and navigate to it
mkdir my-openai-project
cd my-openai-project

# Initialize npm project
npm init -y

# Install packages
npm install @revenium/openai openai dotenv tsx
npm install --save-dev typescript @types/node
```

### 2. Configure Environment Variables

Create a `.env` file in your project root. See [`.env.example`](https://github.com/revenium/revenium-middleware-openai-node/blob/HEAD/.env.example) for all available configuration options.

**Minimum required configuration:**

```env
REVENIUM_METERING_API_KEY=hak_your_revenium_api_key_here
REVENIUM_METERING_BASE_URL=https://api.revenium.ai
OPENAI_API_KEY=sk_your_openai_api_key_here
```

**NOTE: Replace the placeholder values with your actual API keys.**

### 3. Run Your First Example

**For complete examples and usage patterns, see [`examples/README.md`](https://github.com/revenium/revenium-middleware-openai-node/blob/HEAD/examples/README.md).**

---

## Requirements

- Node.js 16+
- OpenAI package v5.0.0 or later
- TypeScript 5.0+ (for TypeScript projects)

---

## What Gets Tracked

The middleware automatically captures comprehensive usage data:

### **Usage Metrics**

- **Token Counts** - Input tokens, output tokens, total tokens
- **Model Information** - Model name, provider (OpenAI/Azure), API version
- **Request Timing** - Request duration, response time
- **Cost Calculation** - Estimated costs based on current pricing

### **Business Context (Optional)**

- **User Tracking** - Subscriber ID, email, credentials
- **Organization Data** - Organization ID, subscription ID, product ID
- **Task Classification** - Task type, agent identifier, trace ID
- **Quality Metrics** - Response quality scores, task identifiers

### **Technical Details**

- **API Endpoints** - Chat completions, embeddings, responses API
- **Request Types** - Streaming vs non-streaming
- **Error Tracking** - Failed requests, error types, retry attempts
- **Environment Info** - Development vs production usage

## API Overview

The middleware provides a Go-aligned API with the following main functions:

- **`Initialize(config?)`** - Initialize the middleware (from environment or explicit config)
- **`GetClient()`** - Get the global Revenium client instance
- **`Configure(config)`** - Alias for `Initialize()` for programmatic configuration
- **`IsInitialized()`** - Check if the middleware is initialized
- **`Reset()`** - Reset the global client (useful for testing)

**For complete API documentation and usage examples, see [`examples/README.md`](https://github.com/revenium/revenium-middleware-openai-node/blob/HEAD/examples/README.md).**

## Trace Visualization Fields

The middleware automatically captures trace visualization fields for distributed tracing and analytics:

| Field                 | Type   | Description                                                                     | Environment Variable               |
| --------------------- | ------ | ------------------------------------------------------------------------------- | ---------------------------------- |
| `environment`         | string | Deployment environment (production, staging, development)                       | `REVENIUM_ENVIRONMENT`, `NODE_ENV` |
| `operationType`       | string | Operation classification (CHAT, EMBED, IMAGE, AUDIO) - automatically detected   | N/A (auto-detected)                |
| `operationSubtype`    | string | Additional detail (function_call, etc.) - automatically detected                | N/A (auto-detected)                |
| `retryNumber`         | number | Retry attempt number (0 for first attempt, 1+ for retries)                      | `REVENIUM_RETRY_NUMBER`            |
| `parentTransactionId` | string | Parent transaction reference for distributed tracing                            | `REVENIUM_PARENT_TRANSACTION_ID`   |
| `transactionName`     | string | Human-friendly operation label                                                  | `REVENIUM_TRANSACTION_NAME`        |
| `region`              | string | Cloud region (us-east-1, etc.) - auto-detected from AWS/Azure/GCP               | `AWS_REGION`, `REVENIUM_REGION`    |
| `credentialAlias`     | string | Human-readable credential name                                                  | `REVENIUM_CREDENTIAL_ALIAS`        |
| `traceType`           | string | Categorical identifier (alphanumeric, hyphens, underscores only, max 128 chars) | `REVENIUM_TRACE_TYPE`              |
| `traceName`           | string | Human-readable label for trace instances (max 256 chars)                        | `REVENIUM_TRACE_NAME`              |

**All trace visualization fields are optional.** The middleware will automatically detect and populate these fields when possible.

### Example Configuration

```env
REVENIUM_ENVIRONMENT=production
REVENIUM_REGION=us-east-1
REVENIUM_CREDENTIAL_ALIAS=OpenAI Production Key
REVENIUM_TRACE_TYPE=customer_support
REVENIUM_TRACE_NAME=Support Ticket #12345
REVENIUM_PARENT_TRANSACTION_ID=parent-txn-123
REVENIUM_TRANSACTION_NAME=Answer Customer Question
REVENIUM_RETRY_NUMBER=0
```

## Metadata Fields

The middleware supports the following optional metadata fields for tracking:

| Field                   | Type   | Description                                                 |
| ----------------------- | ------ | ----------------------------------------------------------- |
| `traceId`               | string | Unique identifier for session or conversation tracking      |
| `taskType`              | string | Type of AI task being performed (e.g., "chat", "embedding") |
| `agent`                 | string | AI agent or bot identifier                                  |
| `organizationId`        | string | Organization or company identifier                          |
| `productId`             | string | Your product or feature identifier                          |
| `subscriptionId`        | string | Subscription plan identifier                                |
| `responseQualityScore`  | number | Custom quality rating (0.0-1.0)                             |
| `subscriber.id`         | string | Unique user identifier                                      |
| `subscriber.email`      | string | User email address                                          |
| `subscriber.credential` | object | Authentication credential (`name` and `value` fields)       |

**All metadata fields are optional.** For complete metadata documentation and usage examples, see:

- [`examples/README.md`](https://github.com/revenium/revenium-middleware-openai-node/blob/HEAD/examples/README.md) - All usage examples
- [Revenium API Reference](https://revenium.readme.io/reference/meter_ai_completion) - Complete API documentation

## Prompt Capture

The middleware can capture prompts and responses for analysis. This feature is **disabled by default** for privacy and performance.

### Configuration

Enable prompt capture globally via environment variable:

```bash
REVENIUM_CAPTURE_PROMPTS=true
REVENIUM_MAX_PROMPT_SIZE=50000  # Optional: default is 50000 characters
```

Or enable per-request via metadata:

```typescript
const response = await client.chat.completions.create(
  {
    model: "gpt-4",
    messages: [{ role: "user", content: "Hello!" }],
  },
  {
    usageMetadata: { capturePrompts: true },
  },
);
```

### Security

Captured prompts are automatically sanitized to remove sensitive credentials:

- API keys (OpenAI, Anthropic, Perplexity)
- Bearer tokens
- Passwords
- Generic tokens and secrets

Prompts exceeding `maxPromptSize` are truncated and marked with `promptsTruncated: true`.

## Configuration Options

### Environment Variables

For a complete list of all available environment variables with examples, see [`.env.example`](https://github.com/revenium/revenium-middleware-openai-node/blob/HEAD/.env.example).

## Examples

The package includes comprehensive examples in the [`examples/`](https://github.com/revenium/revenium-middleware-openai-node/blob/HEAD/examples/) directory.

### Getting Started

```bash
npm run example:getting-started
```

### OpenAI Examples

| Example                         | Command                             | Description                       |
| ------------------------------- | ----------------------------------- | --------------------------------- |
| `openai/basic.ts`               | `npm run example:openai-basic`      | Chat completions and embeddings   |
| `openai/metadata.ts`            | `npm run example:openai-metadata`   | All metadata fields demonstration |
| `openai/streaming.ts`           | `npm run example:openai-stream`     | Streaming chat completions        |
| `openai/responses-basic.ts`     | `npm run example:openai-res-basic`  | Responses API usage               |
| `openai/responses-embed.ts`     | `npm run example:openai-res-embed`  | Embeddings with Responses API     |
| `openai/responses-streaming.ts` | `npm run example:openai-res-stream` | Streaming Responses API           |

### Azure OpenAI Examples

| Example                     | Command                            | Description                   |
| --------------------------- | ---------------------------------- | ----------------------------- |
| `azure/basic.ts`            | `npm run example:azure-basic`      | Azure chat completions        |
| `azure/stream.ts`           | `npm run example:azure-stream`     | Azure streaming               |
| `azure/responses-basic.ts`  | `npm run example:azure-res-basic`  | Azure Responses API           |
| `azure/responses-stream.ts` | `npm run example:azure-res-stream` | Azure Responses API streaming |

**For complete example documentation, setup instructions, and usage patterns, see [`examples/README.md`](https://github.com/revenium/revenium-middleware-openai-node/blob/HEAD/examples/README.md).**

## How It Works

1. **Initialize**: Call `Initialize()` to set up the middleware with your configuration
2. **Get Client**: Call `GetClient()` to get a wrapped OpenAI client instance
3. **Make Requests**: Use the client normally - all requests are automatically tracked
4. **Async Tracking**: Usage data is sent to Revenium in the background (fire-and-forget)
5. **Transparent Response**: Original OpenAI responses are returned unchanged

The middleware never blocks your application - if Revenium tracking fails, your OpenAI requests continue normally.

**Supported APIs:**

- Chat Completions API (`client.chat().completions().create()`)
- Embeddings API (`client.embeddings().create()`)
- Responses API (`client.responses().create()` and `client.responses().createStreaming()`)

## Troubleshooting

### Common Issues

**No tracking data appears:**

1. Verify environment variables are set correctly in `.env`
2. Enable debug logging by setting `REVENIUM_DEBUG=true` in `.env`
3. Check console for `[Revenium]` log messages
4. Verify your `REVENIUM_METERING_API_KEY` is valid

**Client not initialized error:**

- Make sure you call `Initialize()` before `GetClient()`
- Check that your `.env` file is in the project root
- Verify `REVENIUM_METERING_API_KEY` is set

**Azure OpenAI not working:**

- Verify all Azure environment variables are set (see `.env.example`)
- Check that `AZURE_OPENAI_ENDPOINT` and `AZURE_OPENAI_API_KEY` are correct
- Ensure you're using a valid deployment name in the `model` parameter

### Debug Mode

Enable detailed logging by adding to your `.env`:

```env
REVENIUM_DEBUG=true
```

### Getting Help

If issues persist:

1. Enable debug logging (`REVENIUM_DEBUG=true`)
2. Check the [`examples/`](https://github.com/revenium/revenium-middleware-openai-node/blob/HEAD/examples/) directory for working examples
3. Review [`examples/README.md`](https://github.com/revenium/revenium-middleware-openai-node/blob/HEAD/examples/README.md) for detailed setup instructions
4. Contact support@revenium.io with debug logs

## Supported Models

This middleware works with any OpenAI model. For the complete model list, see the [OpenAI Models Documentation](https://platform.openai.com/docs/models).

### API Support Matrix

The following table shows what has been tested and verified with working examples:

| Feature               | Chat Completions | Embeddings | Responses API |
| --------------------- | ---------------- | ---------- | ------------- |
| **OpenAI Basic**      | Yes              | Yes        | Yes           |
| **OpenAI Streaming**  | Yes              | No         | Yes           |
| **Azure Basic**       | Yes              | No         | Yes           |
| **Azure Streaming**   | Yes              | No         | Yes           |
| **Metadata Tracking** | Yes              | Yes        | Yes           |
| **Token Counting**    | Yes              | Yes        | Yes           |

**Note:** "Yes" = Tested with working examples in [`examples/`](https://github.com/revenium/revenium-middleware-openai-node/blob/HEAD/examples/) directory

## Documentation

For detailed documentation, visit [docs.revenium.io](https://docs.revenium.io)

## Contributing

See [CONTRIBUTING.md](https://github.com/revenium/revenium-middleware-openai-node/blob/HEAD/CONTRIBUTING.md)

## Code of Conduct

See [CODE_OF_CONDUCT.md](https://github.com/revenium/revenium-middleware-openai-node/blob/HEAD/CODE_OF_CONDUCT.md)

## Security

See [SECURITY.md](https://github.com/revenium/revenium-middleware-openai-node/blob/HEAD/SECURITY.md)

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/revenium/revenium-middleware-openai-node/blob/HEAD/LICENSE) file for details.

## Support

For issues, feature requests, or contributions:

- **Website**: [www.revenium.ai](https://www.revenium.ai)
- **GitHub Repository**: [revenium/revenium-middleware-openai-node](https://github.com/revenium/revenium-middleware-openai-node)
- **Issues**: [Report bugs or request features](https://github.com/revenium/revenium-middleware-openai-node/issues)
- **Documentation**: [docs.revenium.io](https://docs.revenium.io)
- **Email**: support@revenium.io

---

**Built by Revenium**
