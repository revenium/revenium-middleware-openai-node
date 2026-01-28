# Revenium OpenAI Middleware - Examples

This directory contains examples demonstrating how to use the Revenium OpenAI middleware.

## Prerequisites

Before running the examples, make sure you have:

1. **Node.js 16 or later** installed
2. **Revenium API Key** - Get one from [Revenium Dashboard](https://app.revenium.ai)
3. **OpenAI API Key** - Get one from [OpenAI Platform](https://platform.openai.com)
4. **(Optional) Azure OpenAI credentials** - For Azure examples

## Setup

1. **Clone the repository** (if you haven't already):

   ```bash
   git clone https://github.com/revenium/revenium-middleware-openai-node.git
   cd revenium-middleware-openai-node
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure environment variables**:

   Copy the `.env.example` file to `.env` and edit it with your API keys:

   ```bash
   cp .env.example .env
   ```

   See [.env.example](https://github.com/revenium/revenium-middleware-openai-node/blob/HEAD/.env.example) for all available configuration options.

## Examples

### 1. Getting Started

**File:** `getting_started.ts`

The simplest example to get you started with Revenium tracking:

- Initialize the middleware
- Create a basic chat completion
- Display response and usage metrics

**Run:**

```bash
npm run example:getting-started
# or
npx tsx examples/getting_started.ts
```

**What it does:**

- Loads configuration from environment variables
- Creates a simple chat completion request
- Automatically sends metering data to Revenium API
- Displays the response

---

### 2. OpenAI Basic

**File:** `openai/basic.ts`

Demonstrates standard OpenAI API usage:

- Chat completions with metadata
- Embeddings generation
- Multiple API calls

**Run:**

```bash
npm run example:openai-basic
# or
npx tsx examples/openai/basic.ts
```

**What it does:**

- Creates chat completions with metadata tracking
- Generates text embeddings
- Demonstrates metadata usage for tracking

---

### 3. OpenAI Metadata

**File:** `openai/metadata.ts`

Demonstrates all available metadata fields:

- Complete metadata structure
- All optional fields documented
- Subscriber information

**Run:**

```bash
npm run example:openai-metadata
# or
npx tsx examples/openai/metadata.ts
```

**What it does:**

- Shows all available metadata fields
- Demonstrates subscriber tracking
- Includes organization and product tracking

**Metadata fields supported:**

- `traceId` - Session or conversation tracking identifier
- `taskType` - Type of AI task being performed
- `agent` - AI agent or bot identifier
- `organizationName` - Organization name (used for lookup/auto-creation)
- `productName` - Product or service name (used for lookup/auto-creation)
- `subscriptionId` - Subscription tier identifier
- `responseQualityScore` - Quality rating (0.0-1.0)
- `subscriber` - Nested subscriber object with `id`, `email`, `credential` (with `name` and `value`)

---

### 4. OpenAI Streaming

**File:** `openai/streaming.ts`

Demonstrates streaming responses:

- Real-time token streaming
- Accumulating responses
- Streaming metrics

**Run:**

```bash
npm run example:openai-stream
# or
npx tsx examples/openai/streaming.ts
```

**What it does:**

- Creates a streaming chat completion
- Displays tokens as they arrive in real-time
- Tracks streaming metrics
- Sends metering data after stream completes

---

### 5. OpenAI Responses API (Basic)

**File:** `openai/responses-basic.ts`

Demonstrates OpenAI's Responses API:

- Simplified interface with `input` parameter
- Stateful API features
- Automatic tracking

**Run:**

```bash
npm run example:openai-res-basic
# or
npx tsx examples/openai/responses-basic.ts
```

**What it does:**

- Uses the new Responses API
- Creates responses with metadata
- Demonstrates simplified interface

---

### 6. OpenAI Responses API (Embeddings)

**File:** `openai/responses-embed.ts`

Demonstrates embeddings with Responses API:

- Embeddings generation
- Metadata tracking
- Usage metrics

**Run:**

```bash
npm run example:openai-res-embed
# or
npx tsx examples/openai/responses-embed.ts
```

**What it does:**

- Generates text embeddings
- Tracks embedding usage
- Demonstrates metadata with embeddings

---

### 7. OpenAI Responses API (Streaming)

**File:** `openai/responses-streaming.ts`

Demonstrates streaming with Responses API:

- Real-time streaming responses
- Event handling
- Streaming metrics

**Run:**

```bash
npm run example:openai-res-stream
# or
npx tsx examples/openai/responses-streaming.ts
```

**What it does:**

- Creates streaming responses
- Processes response events in real-time
- Tracks streaming usage metrics

---

### 8. Azure OpenAI (Basic)

**File:** `azure/basic.ts`

Demonstrates Azure OpenAI integration:

- Automatic Azure detection
- Azure-specific configuration
- Chat completions with Azure

**Prerequisites:**

To run this example with Azure OpenAI, you need to configure Azure credentials in `.env`:

```bash
AZURE_OPENAI_API_KEY=your_azure_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_VERSION=your_azure_openai_api_version
```

**Run:**

```bash
npm run example:azure-basic
# or
npx tsx examples/azure/basic.ts
```

**What it does:**

- Automatically detects Azure configuration
- Uses Azure OpenAI for chat completions
- Sends metering data with provider='AZURE_OPENAI'

**Important for Azure:**

When using Azure OpenAI, you must pass your **deployment name** (not the OpenAI model name) in the `model` parameter. The deployment name is what you configured in Azure Portal.

---

### 9. Azure OpenAI (Streaming)

**File:** `azure/stream.ts`

Demonstrates streaming with Azure OpenAI:

- Real-time streaming from Azure
- Azure deployment handling
- Streaming metrics

**Run:**

```bash
npm run example:azure-stream
# or
npx tsx examples/azure/stream.ts
```

**What it does:**

- Creates streaming chat completions with Azure
- Displays tokens in real-time
- Tracks Azure streaming metrics

---

### 10. Azure Responses API (Basic)

**File:** `azure/responses-basic.ts`

Demonstrates Responses API with Azure OpenAI:

- Azure + Responses API
- Simplified interface on Azure
- Automatic tracking

**Run:**

```bash
npm run example:azure-res-basic
# or
npx tsx examples/azure/responses-basic.ts
```

**What it does:**

- Uses Responses API with Azure OpenAI
- Creates responses with Azure deployment
- Tracks Azure usage metrics

---

### 11. Azure Responses API (Streaming)

**File:** `azure/responses-stream.ts`

Demonstrates Responses API streaming with Azure:

- Real-time Responses API on Azure
- Event handling
- Azure streaming metrics

**Run:**

```bash
npm run example:azure-res-stream
# or
npx tsx examples/azure/responses-stream.ts
```

**What it does:**

- Creates streaming responses with Azure
- Processes response events in real-time
- Tracks Azure streaming usage

---

## Common Issues

### "Client not initialized" error

**Solution:** Make sure to call `Initialize()` before using `GetClient()`.

### "REVENIUM_METERING_API_KEY is required" error

**Solution:** Set the `REVENIUM_METERING_API_KEY` environment variable in your `.env` file.

### "invalid Revenium API key format" error

**Solution:** Revenium API keys should start with `hak_`. Check your API key format.

### Environment variables not loading

**Solution:** Make sure your `.env` file is in the project root directory and contains the required variables.

### Azure example not working

**Solution:** Make sure you have set all required Azure environment variables in your `.env` file:

- `AZURE_OPENAI_API_KEY`
- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_API_VERSION`

### Debug Mode

Enable detailed logging to troubleshoot issues:

```bash
# In .env file
REVENIUM_DEBUG=true

# Then run examples
npm run example:getting-started
```

## Next Steps

- Check the [main README](https://github.com/revenium/revenium-middleware-openai-node/blob/HEAD/README.md) for detailed documentation
- Visit the [Revenium Dashboard](https://app.revenium.ai) to view your metering data
- See [.env.example](https://github.com/revenium/revenium-middleware-openai-node/blob/HEAD/.env.example) for all configuration options

## Support

For issues or questions:

- Documentation: https://docs.revenium.io
- Email: support@revenium.io
