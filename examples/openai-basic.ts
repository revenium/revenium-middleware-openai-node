/**
 * OpenAI Basic Example
 *
 * Shows how to use Revenium middleware with OpenAI chat completions and embeddings.
 * Demonstrates seamless metadata integration - all metadata fields are optional!
 *
 * Metadata Options:
 * - Start with basic usage (no metadata) - tracking works automatically
 * - Add subscriber info for user tracking
 * - Include organization/product IDs for business analytics
 * - Use task type and trace ID for detailed analysis
 *
 * For complete metadata field reference, see:
 * https://revenium.readme.io/reference/meter_ai_completion
 */

import 'dotenv/config';
import { initializeReveniumFromEnv, patchOpenAIInstance } from '@revenium/openai';
import OpenAI from 'openai';

async function openaiBasicExample() {
  console.log(' OpenAI Basic Usage with Seamless Metadata Integration\n');

  // Initialize Revenium middleware
  const initResult = initializeReveniumFromEnv();
  if (!initResult.success) {
    console.error(' Failed to initialize Revenium:', initResult.message);
    process.exit(1);
  }

  // Create and patch OpenAI instance
  const openai = patchOpenAIInstance(new OpenAI());

  // Example 1: Basic chat completion (no metadata)
  console.log('Example 1: Basic chat completion (automatic tracking)');

  const basicResponse = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'What is TypeScript in one sentence?' }],
    // No usageMetadata - still automatically tracked!
    // No max_tokens - let response complete naturally
  });

  console.log('Response:', basicResponse.choices[0]?.message?.content);
  console.log('Usage:', basicResponse.usage);
  console.log(' Automatically tracked to Revenium without metadata\n');

  // Example 2: Chat completion with rich metadata (all optional!)
  console.log('Example 2: Chat completion with rich metadata');

  const metadataResponse = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'user', content: 'Explain the benefits of using middleware in 2 sentences.' },
    ],

    // Optional metadata for advanced reporting, lineage tracking, and cost allocation
    usageMetadata: {
      // User identification
      subscriber: {
        id: 'user-12345',
        email: 'developer@company.com',
        credential: {
          name: 'api-key-prod',
          value: 'key-abc-123',
        },
      },

      // Organization & billing
      organizationId: 'my-customer',
      subscriptionId: 'plan-premium-2024',

      // Product & task tracking
      productId: 'ai-assistant',
      taskType: 'explanation-request',
      agent: 'openai-basic-chat-node',

      // Session tracking
      traceId: 'session-' + Date.now(),

      // Quality metrics
      responseQualityScore: 0.95,  // 0.0-1.0 scale
    },
  });

  console.log('Response:', metadataResponse.choices[0]?.message?.content);
  console.log('Usage:', metadataResponse.usage);
  console.log(' Tracked with rich metadata for analytics\n');

  // Example 3: Basic embeddings (no metadata)
  console.log('Example 3: Basic embeddings (automatic tracking)');

  const basicEmbedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: 'Revenium middleware automatically tracks OpenAI usage',
    // No usageMetadata - still automatically tracked!
  });

  console.log('Model:', basicEmbedding.model);
  console.log('Usage:', basicEmbedding.usage);
  console.log('Embedding dimensions:', basicEmbedding.data[0]?.embedding.length);
  console.log('Embeddings automatically tracked without metadata\n');

  // Example 4: Embeddings with metadata (all optional!)
  console.log(' Example 4: Embeddings with rich metadata');

  const metadataEmbedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: 'Advanced text embedding with comprehensive tracking metadata',

    // Optional metadata for advanced reporting, lineage tracking, and cost allocation
    usageMetadata: {
      // User identification
      subscriber: {
        id: 'embedding-user-789',
        email: 'embeddings@company.com',
        credential: {
          name: 'api-key-prod',
          value: 'key-def-456',
        },
      },

      // Organization & billing
      organizationId: 'my-company',
      subscriptionId: 'plan-enterprise-2024',

      // Product & task tracking
      productId: 'search-engine',
      taskType: 'document-embedding',
      agent: 'openai-basic-embeddings-node',

      // Session tracking
      traceId: 'embed-' + Date.now(),

      // Quality metrics
      responseQualityScore: 0.98,  // 0.0-1.0 scale
    },
  });

  console.log('Model:', metadataEmbedding.model);
  console.log('Usage:', metadataEmbedding.usage);
  console.log('Embedding dimensions:', metadataEmbedding.data[0]?.embedding.length);
  console.log(' Embeddings tracked with metadata for business analytics\n');
}

// Run the example
openaiBasicExample().catch(console.error);
