/**
 * Azure OpenAI Streaming Example
 *
 * Shows how to use Revenium middleware with Azure OpenAI streaming responses.
 * Demonstrates seamless metadata integration with Azure streaming - all metadata fields are optional!
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
import { AzureOpenAI } from 'openai';

async function azureStreamingExample() {
  console.log('️ Azure OpenAI Streaming with Seamless Metadata Integration\n');

  // Initialize Revenium middleware
  const initResult = initializeReveniumFromEnv();
  if (!initResult.success) {
    console.error(' Failed to initialize Revenium:', initResult.message);
    process.exit(1);
  }

  // Create Azure OpenAI instance and patch it
  const azure = patchOpenAIInstance(
    new AzureOpenAI({
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview',
    })
  );

  console.log(' Azure OpenAI client configured and patched');
  console.log(' Endpoint:', process.env.AZURE_OPENAI_ENDPOINT);
  console.log(' API Version:', process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview');
  console.log();

  // Check if we have a chat model configured
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const isChatModel = deployment && !deployment.includes('embedding');

  if (!isChatModel) {
    console.log('️  Note: Current Azure deployment appears to be for embeddings.');
    console.log('   To test streaming chat, update .env to use a chat model:');
    console.log('   - Comment out the embeddings section');
    console.log('   - Uncomment the chat testing section');
    console.log('   - Set AZURE_OPENAI_DEPLOYMENT=gpt-4o');
    console.log('\n   Testing embeddings instead (no streaming for embeddings)...\n');
  } else {
    // Example 1: Basic Azure streaming (no metadata)
    console.log(' Example 1: Basic Azure streaming chat (automatic tracking)');
    console.log(' Assistant: ');

    const basicStream = await azure.chat.completions.create({
      model: deployment,
      messages: [
        { role: 'user', content: 'List 3 advantages of Azure OpenAI over standard OpenAI' },
      ],
      stream: true,
      // No usageMetadata - still automatically tracked with Azure provider info when stream completes!
      // No max_tokens - let response complete naturally
    });

    for await (const chunk of basicStream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        process.stdout.write(content);
      }
    }

    console.log('\n Azure streaming automatically tracked to Revenium without metadata\n');
  }

  // Example 2: Azure streaming with rich metadata (all optional!)
  console.log(' Example 2: Azure streaming chat with rich metadata');
  console.log(' Assistant: ');

  const metadataStream = await azure.chat.completions.create({
    model: deployment || 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: 'Write a professional summary about Azure OpenAI benefits for enterprises',
      },
    ],
    stream: true,

    // Optional metadata for advanced reporting, lineage tracking, and cost allocation
    usageMetadata: {
      // User identification
      subscriber: {
        id: 'azure-stream-user-789',
        email: 'enterprise@company.com',
        credential: {
          name: 'api-key-prod',
          value: 'key-mno-345',
        },
      },

      // Organization & billing
      organizationId: 'enterprise-corp',
      subscriptionId: 'plan-azure-stream-2024',

      // Product & task tracking
      productId: 'azure-ai-consultant',
      taskType: 'enterprise-consultation',
      agent: 'azure-streaming-chat-node',

      // Session tracking
      traceId: 'azure-stream-' + Date.now(),

      // Quality metrics
      responseQualityScore: 0.95,  // 0.0-1.0 scale
    },
  });

  for await (const chunk of metadataStream) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) {
      process.stdout.write(content);
    }
  }

  console.log('\n Azure streaming tracked with rich metadata for enterprise analytics\n');

  // Example 3: Azure batch embeddings (no metadata)
  console.log(' Example 3: Azure batch embeddings (automatic tracking)');

  const batchEmbeddings = await azure.embeddings.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT || 'text-embedding-3-large',
    input: [
      'Azure OpenAI provides enterprise security and compliance',
      'Private network access ensures data protection',
      'Managed identity integration simplifies authentication',
    ],
    // No usageMetadata - still automatically tracked with Azure provider info!
  });

  console.log(' Model:', batchEmbeddings.model);
  console.log(' Usage:', batchEmbeddings.usage);
  console.log(' Embeddings count:', batchEmbeddings.data.length);
  console.log(' Azure batch embeddings automatically tracked without metadata\n');

  // Example 4: Azure embeddings with enterprise metadata
  console.log(' Example 4: Azure batch embeddings with enterprise metadata');

  const enterpriseEmbeddings = await azure.embeddings.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT || 'text-embedding-3-large',
    input: [
      'Enterprise document: Azure OpenAI compliance framework',
      'Enterprise document: Data residency and sovereignty requirements',
      'Enterprise document: Integration with Azure Active Directory',
    ],

    // Optional metadata for advanced reporting, lineage tracking, and cost allocation
    usageMetadata: {
      // User identification
      subscriber: {
        id: 'azure-enterprise-processor',
        email: 'processor@enterprise-corp.com',
        credential: {
          name: 'api-key-prod',
          value: 'key-pqr-678',
        },
      },

      // Organization & billing
      organizationId: 'enterprise-corp',
      subscriptionId: 'plan-azure-enterprise-2024',

      // Product & task tracking
      productId: 'azure-document-intelligence',
      taskType: 'enterprise-document-processing',
      agent: 'azure-batch-embeddings-node',

      // Session tracking
      traceId: 'azure-enterprise-' + Date.now(),

      // Quality metrics
      responseQualityScore: 0.96,  // 0.0-1.0 scale
    },
  });

  console.log(' Model:', enterpriseEmbeddings.model);
  console.log(' Usage:', enterpriseEmbeddings.usage);
  console.log(' Embeddings count:', enterpriseEmbeddings.data.length);
  console.log(' Azure enterprise embeddings tracked with comprehensive metadata\n');

  // Summary
  console.log(' Azure OpenAI Streaming Summary:');
  console.log(' Azure streaming responses work seamlessly with metadata');
  console.log(' Usage tracked automatically when Azure streams complete');
  console.log(' Azure batch embeddings supported with optional metadata');
  console.log(' Enterprise-grade tracking with Azure provider metadata');
  console.log(' Model name resolution for accurate Azure pricing');
  console.log(' All metadata fields are optional');
  console.log(' No type casting required - native TypeScript support');
  console.log(' Real-time Azure streaming + comprehensive enterprise analytics');
}

// Run the example
azureStreamingExample().catch(console.error);
