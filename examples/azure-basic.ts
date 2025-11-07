/**
 * Azure OpenAI Basic Example
 *
 * Shows how to use Revenium middleware with Azure OpenAI chat completions and embeddings.
 * Demonstrates seamless metadata integration with Azure - all metadata fields are optional!
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

async function azureBasicExample() {
  console.log('️ Azure OpenAI Basic Usage with Seamless Metadata Integration\n');

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
    console.log('   To test chat completions, update .env to use a chat model:');
    console.log('   - Comment out the embeddings section');
    console.log('   - Uncomment the chat testing section');
    console.log('   - Set AZURE_OPENAI_DEPLOYMENT=gpt-4o');
    console.log('\n   Skipping chat examples and testing embeddings instead...\n');
  } else {
    // Example 1: Basic Azure chat completion (no metadata)
    console.log(' Example 1: Basic Azure chat completion (automatic tracking)');

    const basicResponse = await azure.chat.completions.create({
      model: deployment,
      messages: [{ role: 'user', content: 'What are the benefits of using Azure OpenAI?' }],
      // No usageMetadata - still automatically tracked with Azure provider info!
      // No max_tokens - let response complete naturally
    });

    console.log(' Response:', basicResponse.choices[0]?.message?.content);
    console.log(' Usage:', basicResponse.usage);
    console.log(' Automatically tracked to Revenium with Azure provider metadata\n');
  }

  if (isChatModel) {
    // Example 2: Azure chat completion with rich metadata (all optional!)
    console.log(' Example 2: Azure chat completion with rich metadata');

    const metadataResponse = await azure.chat.completions.create({
      model: deployment,
      messages: [
        {
          role: 'user',
          content: 'Explain how Azure OpenAI differs from standard OpenAI in 3 points.',
        },
      ],

      // Optional metadata for advanced reporting, lineage tracking, and cost allocation
      usageMetadata: {
        // User identification
        subscriber: {
          id: 'azure-user-789',
          email: 'azure-dev@company.com',
          credential: {
            name: 'api-key-prod',
            value: 'key-jkl-012',
          },
        },

        // Organization & billing
        organizationId: 'enterprise-corp',
        subscriptionId: 'plan-azure-enterprise-2024',

        // Product & task tracking
        productId: 'azure-ai-platform',
        taskType: 'azure-comparison',
        agent: 'azure-basic-chat-node',

        // Session tracking
        traceId: 'azure-' + Date.now(),

        // Quality metrics
        responseQualityScore: 0.92,  // 0.0-1.0 scale
      },
    });

    console.log(' Response:', metadataResponse.choices[0]?.message?.content);
    console.log(' Usage:', metadataResponse.usage);
    console.log(' Tracked with Azure provider + rich metadata for enterprise analytics\n');
  }

  // Example 3: Azure embeddings (requires embeddings model)
  console.log(' Example 3: Azure embeddings');

  if (isChatModel) {
    console.log('️  Note: Current deployment is a chat model (gpt-4o).');
    console.log('   Embeddings require an embedding model like text-embedding-3-large.');
    console.log('   To test embeddings, switch .env to embeddings configuration.');
    console.log('   Skipping embeddings examples.\n');
  } else {
    console.log(' Example 3a: Basic Azure embeddings (automatic tracking)');

    const basicEmbedding = await azure.embeddings.create({
      model: deployment || 'text-embedding-3-large',
      input:
        'Azure OpenAI provides enterprise-grade AI capabilities with enhanced security and compliance',
      // No usageMetadata - still automatically tracked with Azure provider info!
    });

    console.log(' Model:', basicEmbedding.model);
    console.log(' Usage:', basicEmbedding.usage);
    console.log(' Embedding dimensions:', basicEmbedding.data[0]?.embedding.length);
    console.log(' Azure embeddings automatically tracked without metadata\n');

    // Example 4: Azure embeddings with metadata (all optional!)
    console.log(' Example 3b: Azure embeddings with rich metadata');

    const metadataEmbedding = await azure.embeddings.create({
      model: deployment || 'text-embedding-3-large',
      input:
        'Enterprise document processing with Azure OpenAI embeddings and comprehensive tracking',

      //  All metadata fields are optional - perfect for Azure enterprise use cases!
      // Note: Nested subscriber structure matches Python middleware for consistency
      usageMetadata: {
        subscriber: {
          id: 'azure-embed-user-456',
          email: 'embeddings@enterprise-corp.com',
          credential: {
            name: 'azure-embed-key',
            value: 'embed456',
          },
        },
        organizationId: 'enterprise-corp',
        productId: 'azure-search-platform',
        subscriptionId: 'sub-azure-premium-999',
        taskType: 'enterprise-document-embedding',
        traceId: `azure-embed-${Date.now()}`,
        agent: 'azure-basic-embeddings-node',
      },
    });

    console.log(' Model:', metadataEmbedding.model);
    console.log(' Usage:', metadataEmbedding.usage);
    console.log(' Embedding dimensions:', metadataEmbedding.data[0]?.embedding.length);
    console.log(' Azure embeddings tracked with metadata for enterprise analytics\n');
  }

  // Summary
  console.log(' Azure OpenAI Summary:');
  console.log(' Azure OpenAI automatically detected and tracked');
  console.log(' Model name resolution for accurate pricing');
  console.log(' Provider metadata includes "Azure" for analytics');
  if (isChatModel) {
    console.log(' Chat completions work with or without metadata');
  } else {
    console.log(' Embeddings work with or without metadata');
  }
  console.log(' All metadata fields are optional');
  console.log(' No type casting required - native TypeScript support');
  console.log(' Enterprise-grade tracking with Azure compliance');

  if (!isChatModel) {
    console.log('\n To test Azure chat completions:');
    console.log('   1. Edit .env file');
    console.log('   2. Comment out embeddings section');
    console.log('   3. Uncomment chat section');
    console.log('   4. Run this example again');
  } else {
    console.log('\n To test Azure embeddings:');
    console.log('   1. Edit .env file');
    console.log('   2. Comment out chat section');
    console.log('   3. Uncomment embeddings section');
    console.log('   4. Run this example again');
  }
}

// Run the example
azureBasicExample().catch(console.error);
