# Revenium OpenAI Middleware for Node.js

[![npm version](https://img.shields.io/npm/v/@revenium/openai.svg)](https://www.npmjs.com/package/@revenium/openai)
[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green)](https://nodejs.org/)
[![Documentation](https://img.shields.io/badge/docs-revenium.io-blue)](https://docs.revenium.io)
[![Website](https://img.shields.io/badge/website-revenium.ai-blue)](https://www.revenium.ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Transparent TypeScript middleware for automatic Revenium usage tracking with OpenAI**

A professional-grade Node.js middleware that seamlessly integrates with OpenAI and Azure OpenAI to provide automatic usage tracking, billing analytics, and comprehensive metadata collection. Features native TypeScript support with zero type casting required and supports both traditional Chat Completions API and the new Responses API.

## Features

- **Seamless Integration** - Native TypeScript support, no type casting required
- **Optional Metadata** - Track users, organizations, and business context (12 predefined fields, all optional)
- **Dual API Support** - Chat Completions API + Responses API
- **Azure OpenAI Support** - Full Azure OpenAI integration with automatic detection
- **Type Safety** - Complete TypeScript support with IntelliSense
- **Streaming Support** - Handles regular and streaming requests seamlessly
- **Fire-and-Forget** - Never blocks your application flow
- **Zero Configuration** - Auto-initialization from environment variables

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

Create a `.env` file:

**NOTE: YOU MUST REPLACE THE PLACEHOLDERS WITH YOUR OWN API KEYS**

```env
REVENIUM_METERING_BASE_URL=https://api.revenium.ai
REVENIUM_METERING_API_KEY=hak_your_revenium_api_key_here
OPENAI_API_KEY=sk_your_openai_api_key_here
```

### 3. Run Your First Example

Run the [getting started example](https://github.com/revenium/revenium-middleware-openai-node/blob/HEAD/examples/getting_started.ts):

```bash
npx tsx node_modules/@revenium/openai/examples/getting_started.ts
```

Or with debug logging:

```bash
# Linux/macOS
REVENIUM_DEBUG=true npx tsx node_modules/@revenium/openai/examples/getting_started.ts

# Windows (PowerShell)
$env:REVENIUM_DEBUG="true"; npx tsx node_modules/@revenium/openai/examples/getting_started.ts
```

**For more examples and usage patterns, see [examples/README.md](https://github.com/revenium/revenium-middleware-openai-node/blob/HEAD/examples/README.md).**

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

## Advanced Usage

### Initialization Options

The middleware supports three initialization patterns:

**Automatic (Recommended)** - Import and patch OpenAI instance:

```typescript
import { patchOpenAIInstance } from '@revenium/openai';
import OpenAI from 'openai';

const openai = patchOpenAIInstance(new OpenAI());
// Tracking works automatically if env vars are set
```

**Explicit** - Call `initializeReveniumFromEnv()` for error handling control:

```typescript
import { initializeReveniumFromEnv, patchOpenAIInstance } from '@revenium/openai';
import OpenAI from 'openai';

const result = initializeReveniumFromEnv();
if (!result.success) {
  console.error('Failed to initialize:', result.message);
  process.exit(1);
}

const openai = patchOpenAIInstance(new OpenAI());
```

**Manual** - Use `configure()` to set all options programmatically (see Manual Configuration below).

For detailed examples of all initialization patterns, see [`examples/`](https://github.com/revenium/revenium-middleware-openai-node/blob/HEAD/examples/README.md).

### Streaming Responses

Streaming is fully supported with real-time token tracking. The middleware automatically tracks streaming responses without any additional configuration.

See [`examples/openai-streaming.ts`](https://github.com/revenium/revenium-middleware-openai-node/blob/HEAD/examples/openai-streaming.ts) and [`examples/azure-streaming.ts`](https://github.com/revenium/revenium-middleware-openai-node/blob/HEAD/examples/azure-streaming.ts) for working streaming examples.

### Custom Metadata Tracking

Add business context to track usage by organization, user, task type, or custom identifiers. Pass a `usageMetadata` object with any of these optional fields:

| Field | Description | Use Case |
|-------|-------------|----------|
| `traceId` | Unique identifier for session or conversation tracking | Link multiple API calls together for debugging, user session analytics, or distributed tracing across services |
| `taskType` | Type of AI task being performed | Categorize usage by workload (e.g., "chat", "code-generation", "doc-summary") for cost analysis and optimization |
| `subscriber.id` | Unique user identifier | Track individual user consumption for billing, rate limiting, or user analytics |
| `subscriber.email` | User email address | Identify users for support, compliance, or usage reports |
| `subscriber.credential.name` | Authentication credential name | Track which API key or service account made the request |
| `subscriber.credential.value` | Authentication credential value | Associate usage with specific credentials for security auditing |
| `organizationId` | Organization or company identifier | Multi-tenant cost allocation, usage quotas per organization |
| `subscriptionId` | Subscription plan identifier | Track usage against subscription limits, identify plan upgrade opportunities |
| `productId` | Your product or feature identifier | Attribute AI costs to specific features in your application (e.g., "chatbot", "email-assistant") |
| `agent` | AI agent or bot identifier | Distinguish between multiple AI agents or automation workflows in your system |
| `responseQualityScore` | Custom quality rating (0.0-1.0) | Track user satisfaction or automated quality metrics for model performance analysis |

**Resources:**
- [API Reference](https://revenium.readme.io/reference/meter_ai_completion) - Complete metadata field documentation

### OpenAI Responses API
**Use case:** Using OpenAI's Responses API with string inputs and simplified interface.

See working examples:
- `examples/openai-responses-basic.ts` - Basic Responses API usage
- `examples/openai-responses-streaming.ts` - Streaming with Responses API

### Azure OpenAI Integration
**Use case:** Automatic Azure OpenAI detection with deployment name resolution and accurate pricing.

See working examples:
- `examples/azure-basic.ts` - Azure chat completions and embeddings
- `examples/azure-responses-basic.ts` - Azure Responses API integration

### Embeddings with Metadata
**Use case:** Track embeddings usage for search engines, RAG systems, and document processing.

Embeddings examples are included in:
- `examples/openai-basic.ts` - Text embeddings with metadata
- `examples/openai-streaming.ts` - Batch embeddings processing

### Manual Configuration

For advanced use cases, configure the middleware manually:

```typescript
import { configure, patchOpenAIInstance } from '@revenium/openai';
import OpenAI from 'openai';

configure({
  reveniumApiKey: 'hak_your_api_key',
  reveniumBaseUrl: 'https://api.revenium.ai',
  debug: true,
});

const openai = patchOpenAIInstance(new OpenAI());
```

## Configuration Options

### Environment Variables

| Variable                       | Required | Default                         | Description                                    |
| ------------------------------ | -------- | ------------------------------- | ---------------------------------------------- |
| `REVENIUM_METERING_API_KEY`    | true     | -                               | Your Revenium API key (starts with `hak_`)     |
| `OPENAI_API_KEY`               | true     | -                               | Your OpenAI API key (starts with `sk-`)        |
| `REVENIUM_METERING_BASE_URL`   | false    | `https://api.revenium.ai` | Revenium metering API base URL                 |
| `REVENIUM_DEBUG`               | false    | `false`                         | Enable debug logging (`true`/`false`)          |
| `AZURE_OPENAI_ENDPOINT`        | false    | -                               | Azure OpenAI endpoint URL (for Azure testing)  |
| `AZURE_OPENAI_API_KEY`         | false    | -                               | Azure OpenAI API key (for Azure testing)       |
| `AZURE_OPENAI_DEPLOYMENT`      | false    | -                               | Azure OpenAI deployment name (for Azure)       |
| `AZURE_OPENAI_API_VERSION`     | false    | `2024-12-01-preview`            | Azure OpenAI API version (for Azure)           |

**Important Note about `REVENIUM_METERING_BASE_URL`:**

- This variable is **optional** and defaults to the production URL (`https://api.revenium.ai`)
- If you don't set it explicitly, the middleware will use the default production endpoint
- However, you may see console warnings or errors if the middleware cannot determine the correct environment
- **Best practice:** Always set this variable explicitly to match your environment:

  ```bash
  # Default production URL (recommended)
  REVENIUM_METERING_BASE_URL=https://api.revenium.ai
  ```

- **Remember:** Your `REVENIUM_METERING_API_KEY` must match your base URL environment

## Included Examples

The package includes comprehensive example files covering:

- **Getting Started** - Simple entry point with all metadata fields documented
- **Chat Completions** - Basic and streaming usage patterns
- **Responses API** - OpenAI's new API with simplified interface
- **Azure OpenAI** - Automatic Azure detection and integration
- **Embeddings** - Text embedding generation with tracking

Run the getting started example:
```bash
npx tsx node_modules/@revenium/openai/examples/getting_started.ts
```

For complete example documentation, setup instructions, and all available examples, see [examples/README.md](https://github.com/revenium/revenium-middleware-openai-node/blob/HEAD/examples/README.md).

## How It Works

1. **Automatic Patching**: When imported, the middleware patches OpenAI's methods:
   - `chat.completions.create` (Chat Completions API)
   - `responses.create` (Responses API - when available)
   - `embeddings.create` (Embeddings API)
2. **Request Interception**: All OpenAI requests are intercepted to extract metadata
3. **Usage Extraction**: Token counts, model info, and timing data are captured
4. **Async Tracking**: Usage data is sent to Revenium in the background (fire-and-forget)
5. **Transparent Response**: Original OpenAI responses are returned unchanged

The middleware never blocks your application - if Revenium tracking fails, your OpenAI requests continue normally.

## Troubleshooting

### Common Issues

#### No tracking data appears

Ensure environment variables are set and enable debug logging:

```bash
export REVENIUM_METERING_API_KEY="hak_your_key"
export OPENAI_API_KEY="sk_your_key"
export REVENIUM_DEBUG=true
```

Look for these log messages:
```
[Revenium Debug] OpenAI chat.completions.create intercepted
[Revenium Debug] Revenium tracking successful
```

#### TypeScript errors with usageMetadata

Import the middleware before OpenAI to enable type augmentation:

```typescript
import { initializeReveniumFromEnv, patchOpenAIInstance } from '@revenium/openai';
import OpenAI from 'openai';
```

#### Azure OpenAI not tracking

Ensure you patch the Azure client:

```typescript
import { AzureOpenAI } from 'openai';
import { patchOpenAIInstance } from '@revenium/openai';

const azure = patchOpenAIInstance(new AzureOpenAI({...}));
```

### Debug Mode

Enable detailed logging:

```bash
export REVENIUM_DEBUG=true
```

### Getting Help

If issues persist:

1. Check logs with `REVENIUM_DEBUG=true`
2. Verify environment variables are set
3. Test with `examples/getting_started.ts`
4. Contact support@revenium.io with debug logs

## Supported Models

This middleware works with any OpenAI model. Examples in this package include:

**Chat Completions:**
- `gpt-4o-mini`, `gpt-4o` (GPT-4 family)
- `gpt-5`, `gpt-5-mini`, `gpt-5-nano` (GPT-5 family)

**Embeddings:**
- `text-embedding-3-small`, `text-embedding-3-large`

**Azure OpenAI:**
- Works with any Azure deployment (deployment names automatically resolved)

For the complete model list and latest specifications, see the [OpenAI Models Documentation](https://platform.openai.com/docs/models).

For cost tracking across providers, see the [Revenium Model Catalog](https://revenium.readme.io/v2.0.0/reference/get_ai_model).

### API Support Matrix

| Feature               | Chat Completions API | Responses API | Embeddings API |
| --------------------- | -------------------- | ------------- | -------------- |
| **Basic Requests**    | Yes                  | Yes           | Yes            |
| **Streaming**         | Yes                  | Yes           | No             |
| **Metadata Tracking** | Yes                  | Yes           | Yes            |
| **Azure OpenAI**      | Yes                  | Yes           | Yes            |
| **Cost Calculation**  | Yes                  | Yes           | Yes            |
| **Token Counting**    | Yes                  | Yes           | Yes            |

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

- **GitHub Repository**: [revenium/revenium-middleware-openai-node](https://github.com/revenium/revenium-middleware-openai-node)
- **Issues**: [Report bugs or request features](https://github.com/revenium/revenium-middleware-openai-node/issues)
- **Documentation**: [docs.revenium.io](https://docs.revenium.io)
- **Contact**: Reach out to the Revenium team for additional support

## Development

For development and testing instructions, see [DEVELOPMENT.md](https://github.com/revenium/revenium-middleware-openai-node/blob/HEAD/DEVELOPMENT.md).

---

**Built by Revenium**
