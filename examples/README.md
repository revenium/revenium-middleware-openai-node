# Revenium OpenAI Middleware - Examples

**TypeScript-first** examples demonstrating automatic Revenium usage tracking with the OpenAI SDK.

## Getting Started - Step by Step

### 1. Create Your Project

```bash
# Create project directory
mkdir my-openai-project
cd my-openai-project

# Initialize Node.js project
npm init -y
```

### 2. Install Dependencies

```bash
npm install @revenium/openai openai dotenv
npm install -D typescript tsx @types/node  # For TypeScript
```

### 3. Environment Setup

Create a `.env` file in your project root:

```bash
# Required
REVENIUM_METERING_API_KEY=hak_your_revenium_api_key
OPENAI_API_KEY=sk_your_openai_api_key

# Optional
REVENIUM_METERING_BASE_URL=https://api.revenium.ai
REVENIUM_DEBUG=false

# Optional - For Azure OpenAI examples
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
AZURE_OPENAI_API_KEY=your-azure-api-key
AZURE_OPENAI_DEPLOYMENT=your-deployment-name
AZURE_OPENAI_API_VERSION=2024-12-01-preview
```

### 4. Run Examples

**If you cloned from GitHub:**

```bash
# Run examples directly
npx tsx examples/getting_started.ts
npx tsx examples/openai-basic.ts
npx tsx examples/openai-streaming.ts
```

**If you installed via npm:**

Examples are included in your `node_modules/@revenium/openai/examples/` directory:

```bash
npx tsx node_modules/@revenium/openai/examples/getting_started.ts
npx tsx node_modules/@revenium/openai/examples/openai-basic.ts
npx tsx node_modules/@revenium/openai/examples/openai-streaming.ts
```

## Available Examples

### `getting_started.ts` - Simple Entry Point

The simplest example to get you started with Revenium tracking:

- **Minimal setup** - Just import, configure, and start tracking
- **Complete metadata example** - Shows all 11 optional metadata fields in comments
- **Ready to customize** - Uncomment the metadata section to add tracking context

**Key Features:**

- Auto-initialization from environment variables
- Native `usageMetadata` support via module augmentation
- All metadata fields documented with examples
- Single API call demonstration

**Perfect for:** First-time users, quick validation, understanding metadata structure

**See the file for complete code examples.**

### `openai-basic.ts` - Chat Completions and Embeddings

Demonstrates standard OpenAI API usage with automatic tracking:

- **Chat completions** - Basic chat API with metadata tracking
- **Embeddings** - Text embedding generation with usage tracking
- **Multiple API calls** - Batch operations with consistent metadata

**Key Features:**

- TypeScript module augmentation for native `usageMetadata` support
- Full type safety with IntelliSense
- Comprehensive metadata examples
- Error handling patterns

**Perfect for:** Understanding basic OpenAI API patterns with tracking

**See the file for complete code examples.**

### `openai-streaming.ts` - Real-time Streaming

Demonstrates streaming responses with automatic token tracking:

- **Streaming chat completions** - Real-time token streaming with metadata
- **Batch embeddings** - Multiple embedding requests efficiently
- **Stream processing** - Type-safe event handling

**Key Features:**

- Automatic tracking when stream completes
- Real-time token counting
- Time-to-first-token metrics
- Stream error handling

**Perfect for:** Real-time applications, chatbots, interactive AI assistants

**See the file for complete code examples.**

### `openai-responses-basic.ts` - Responses API

Demonstrates OpenAI's Responses API:

- **Simplified interface** - Uses `input` instead of `messages` parameter
- **Stateful API** - Enhanced capabilities for agent-like applications
- **Unified experience** - Combines chat completions and assistants features

**Key Features:**

- New Responses API patterns
- Automatic tracking with new API
- Metadata support
- Backward compatibility notes

**Perfect for:** Applications using OpenAI's latest API features

**See the file for complete code examples.**

### `openai-responses-streaming.ts` - Responses API Streaming

Demonstrates streaming with the new Responses API:

- **Streaming responses** - Real-time responses with new API
- **Event handling** - Process response events as they arrive
- **Usage tracking** - Automatic tracking for streaming responses

**Key Features:**

- Responses API streaming patterns
- Type-safe event processing
- Automatic usage metrics
- Stream completion tracking

**Perfect for:** Real-time applications using the new Responses API

**See the file for complete code examples.**

### Azure OpenAI Examples

#### `azure-basic.ts` - Azure Chat Completions

Demonstrates Azure OpenAI integration with automatic detection:

- **Azure configuration** - Environment-based Azure setup
- **Chat completions** - Azure-hosted models with tracking
- **Automatic detection** - Middleware detects Azure vs OpenAI automatically

**Key Features:**

- Azure OpenAI deployment configuration
- Model name resolution for Azure
- Accurate Azure pricing
- Metadata tracking with Azure

**Perfect for:** Enterprise applications using Azure OpenAI

**See the file for complete code examples.**

#### `azure-streaming.ts` - Azure Streaming

Demonstrates streaming with Azure OpenAI:

- **Azure streaming** - Real-time responses from Azure-hosted models
- **Deployment resolution** - Automatic Azure deployment name handling
- **Usage tracking** - Azure-specific metrics and pricing

**Perfect for:** Real-time Azure OpenAI applications

**See the file for complete code examples.**

#### `azure-responses-basic.ts` - Azure Responses API

Demonstrates new Responses API with Azure OpenAI:

- **Azure + Responses API** - Combine Azure hosting with new API
- **Unified interface** - Same Responses API patterns on Azure
- **Automatic tracking** - Azure-aware usage tracking

**Perfect for:** Azure applications using latest OpenAI features

**See the file for complete code examples.**

#### `azure-responses-streaming.ts` - Azure Responses Streaming

Demonstrates Responses API streaming with Azure OpenAI:

- **Azure streaming** - Real-time Responses API on Azure
- **Event handling** - Process Azure response events
- **Complete tracking** - Azure metrics with new API

**Perfect for:** Real-time Azure applications with Responses API

**See the file for complete code examples.**

## TypeScript Configuration

Ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true
  }
}
```

## Requirements

- **Node.js 16+** with TypeScript support
- **TypeScript 4.5+** for module augmentation features
- **Valid Revenium API key** (starts with `hak_`)
- **Valid OpenAI API key** (starts with `sk-`) or Azure OpenAI credentials
- **OpenAI SDK 5.0+** (5.8+ for Responses API)

## Troubleshooting

### Module Augmentation Not Working

**Problem:** TypeScript doesn't recognize `usageMetadata` in OpenAI SDK calls

**Solution:**

```typescript
// ❌ Wrong - missing module augmentation import
import { initializeReveniumFromEnv } from "@revenium/openai";

// ✅ Correct - import for module augmentation
import { initializeReveniumFromEnv, patchOpenAIInstance } from "@revenium/openai";
import OpenAI from "openai";
```

### Environment Variables Not Loading

**Problem:** `REVENIUM_METERING_API_KEY` or `OPENAI_API_KEY` not found

**Solutions:**

- Ensure `.env` file is in project root
- Check variable names match exactly
- Verify you're importing `dotenv/config` before the middleware
- Check API keys have correct prefixes (`hak_` for Revenium, `sk-` for OpenAI)

### TypeScript Compilation Errors

**Problem:** Module resolution or import errors

**Solution:** Verify your `tsconfig.json` settings:

```json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true
  }
}
```

### Azure Configuration Issues

**Problem:** Azure OpenAI not working or incorrect pricing

**Solutions:**

- Verify all Azure environment variables are set (`AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT`)
- Check deployment name matches your Azure resource
- Ensure API version is compatible (`2024-12-01-preview` or later recommended)
- Verify endpoint URL format: `https://your-resource-name.openai.azure.com/`

### Debug Mode

Enable detailed logging to troubleshoot issues:

```bash
# In .env file
REVENIUM_DEBUG=true

# Then run examples
npx tsx examples/getting_started.ts
```

## Additional Resources

- **Main Documentation**: See root [README.md](https://github.com/revenium/revenium-middleware-openai-node/blob/HEAD/README.md)
- **API Reference**: [Revenium Metadata Fields](https://revenium.readme.io/reference/meter_ai_completion)
- **OpenAI Documentation**: [OpenAI API Reference](https://platform.openai.com/docs)
- **Issues**: [Report bugs](https://github.com/revenium/revenium-middleware-openai-node/issues)
