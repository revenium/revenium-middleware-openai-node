/**
 * OpenAI Streaming Example
 *
 * Shows how to use Revenium middleware with streaming OpenAI responses and batch embeddings.
 * Demonstrates seamless metadata integration with streaming - all metadata fields are optional!
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

async function openaiStreamingExample() {
  console.log(' OpenAI Streaming with Seamless Metadata Integration\n');

  // Initialize Revenium middleware
  const initResult = initializeReveniumFromEnv();
  if (!initResult.success) {
    console.error(' Failed to initialize Revenium:', initResult.message);
    process.exit(1);
  }

  // Create and patch OpenAI instance
  const openai = patchOpenAIInstance(new OpenAI());

  // Example 1: Basic streaming (no metadata)
  console.log(' Example 1: Basic streaming chat (automatic tracking)');
  console.log(' Assistant: ');

  const basicStream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'Count from 1 to 5 slowly' }],
    stream: true,
    // No usageMetadata - still automatically tracked when stream completes!
    // No max_tokens - let response complete naturally
  });

  for await (const chunk of basicStream) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) {
      process.stdout.write(content);
    }
  }

  console.log('\n Streaming automatically tracked to Revenium without metadata\n');

  // Example 2: Streaming with rich metadata (all optional!)
  console.log(' Example 2: Streaming chat with rich metadata');
  console.log(' Assistant: ');

  const metadataStream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'Write a haiku about middleware' }],
    stream: true,

    // Optional metadata for advanced reporting, lineage tracking, and cost allocation
    usageMetadata: {
      // User identification
      subscriber: {
        id: 'streaming-user-456',
        email: 'poet@company.com',
        credential: {
          name: 'api-key-prod',
          value: 'key-ghi-789',
        },
      },

      // Organization & billing
      organizationId: 'creative-company',
      subscriptionId: 'plan-creative-2024',

      // Product & task tracking
      productId: 'ai-poet',
      taskType: 'creative-writing',
      agent: 'openai-streaming-chat-node',

      // Session tracking
      traceId: 'stream-' + Date.now(),

      // Quality metrics
      responseQualityScore: 0.92,  // 0.0-1.0 scale
    },
  });

  for await (const chunk of metadataStream) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) {
      process.stdout.write(content);
    }
  }

  console.log('\n Streaming tracked with rich metadata for analytics\n');

  // Example 3: Batch embeddings (no metadata)
  console.log(' Example 3: Batch embeddings (automatic tracking)');

  const batchEmbeddings = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: [
      'First document for batch processing',
      'Second document for batch processing',
      'Third document for batch processing',
    ],
    // No usageMetadata - still automatically tracked!
  });

  console.log(' Model:', batchEmbeddings.model);
  console.log(' Usage:', batchEmbeddings.usage);
  console.log(' Embeddings count:', batchEmbeddings.data.length);
  console.log(' Batch embeddings automatically tracked without metadata\n');

  // Example 4: Embeddings with metadata for batch processing
  console.log(' Example 4: Batch embeddings with metadata');

  const metadataBatchEmbeddings = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: [
      'Document 1: Streaming responses provide real-time feedback',
      'Document 2: Metadata enables rich business analytics',
      'Document 3: Batch processing improves efficiency',
    ],

    //  All metadata fields are optional - perfect for batch operations!
    usageMetadata: {
      // User tracking (optional) - nested subscriber object
      subscriber: {
        id: 'batch-processor-123',
        email: 'batch@data-company.com',
        credential: {
          name: 'batch-key',
          value: 'batch-value-456',
        },
      },

      // Business context (optional)
      organizationId: 'data-company',
      productId: 'document-search',

      // Task classification (optional)
      taskType: 'batch-document-embedding',
      traceId: `batch-${Date.now()}`,

      // Custom fields (optional)
      agent: 'openai-batch-embeddings-metadata-node',
    },
  });

  console.log(' Model:', metadataBatchEmbeddings.model);
  console.log(' Usage:', metadataBatchEmbeddings.usage);
  console.log(' Embeddings count:', metadataBatchEmbeddings.data.length);
  console.log(' Batch embeddings tracked with metadata for business insights\n');

  // Summary
  console.log(' Summary:');
  console.log(' Streaming responses work seamlessly with metadata');
  console.log(' Usage tracked automatically when streams complete');
  console.log(' Batch embeddings supported with optional metadata');
  console.log(' All metadata fields are optional');
  console.log(' No type casting required - native TypeScript support');
  console.log(' Real-time streaming + comprehensive analytics');
}

// Run the example
openaiStreamingExample().catch(console.error);
