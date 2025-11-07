/**
 * Azure OpenAI Responses API Streaming Examples
 *
 * This file demonstrates how to use the new Azure OpenAI Responses API with streaming enabled
 * using the Revenium middleware. The Responses API supports streaming for real-time
 * response generation in Azure environments.
 *
 * Metadata Options:
 * - Start with basic usage (no metadata) - tracking works automatically
 * - Add subscriber info for user tracking
 * - Include organization/product IDs for business analytics
 * - Use task type and trace ID for detailed analysis
 *
 * For complete metadata field reference, see:
 * https://revenium.readme.io/reference/meter_ai_completion
 *
 * Responses API Reference: https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/responses
 */

import 'dotenv/config';
import { initializeReveniumFromEnv, patchOpenAIInstance } from '@revenium/openai';
import OpenAI from 'openai';

// Import types for the new Responses API
import type { ResponsesCreateParams } from '../src/types/responses-api.js';

async function main() {
  // Initialize Revenium middleware
  await initializeReveniumFromEnv();

  // Check for Azure configuration
  if (
    !process.env.AZURE_OPENAI_API_KEY ||
    !process.env.AZURE_OPENAI_ENDPOINT ||
    !process.env.AZURE_OPENAI_DEPLOYMENT_NAME
  ) {
    console.log(
      '️ Azure OpenAI configuration missing. Please set AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, and AZURE_OPENAI_DEPLOYMENT_NAME'
    );
    return;
  }

  // Create Azure OpenAI client
  const azure = new OpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
    defaultQuery: { 'api-version': '2024-12-01-preview' },
    defaultHeaders: {
      'api-key': process.env.AZURE_OPENAI_API_KEY,
    },
  });

  // Patch the Azure OpenAI instance to add Revenium tracking
  patchOpenAIInstance(azure);

  console.log(' Azure OpenAI Responses API Streaming Examples\n');

  // Example 1: Basic Azure Responses API streaming (no metadata)
  console.log(' Example 1: Basic Azure Responses API streaming (no metadata)');
  try {
    const responsesAPI = azure as any; // Type assertion for new API

    if (responsesAPI.responses?.create) {
      const stream = await responsesAPI.responses.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o',
        input: 'Tell me about the advantages of using Azure cloud services for AI workloads.',
        stream: true,
      } as ResponsesCreateParams);

      console.log('Streaming Azure response:');
      for await (const event of stream) {
        if (event.type === 'response.output_text.delta') {
          process.stdout.write(event.delta);
        }
      }
      console.log('\n Azure stream completed');
    } else {
      throw new Error('Responses API not available');
    }
  } catch (error) {
    console.log('️ Azure Responses API not yet available in this OpenAI SDK version');
    console.log('   Error:', (error as Error).message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Example 2: Azure Responses API streaming with rich enterprise metadata
  console.log(' Example 2: Azure Responses API streaming with rich enterprise metadata');
  try {
    const responsesAPI = azure as any;

    if (responsesAPI.responses?.create) {
      const stream = await responsesAPI.responses.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o',
        input: [
          {
            role: 'user',
            content:
              'Explain how to implement secure AI solutions using Azure OpenAI with enterprise-grade security.',
          },
        ],
        stream: true,
        temperature: 0.7,
        max_output_tokens: 250,
        usageMetadata: {
          // User identification
          subscriber: {
            id: 'azure-security-expert-123',
            email: 'security@azureenterprise.com',
            credential: {
              name: 'api-key-prod',
              value: 'key-yza-567',
            },
          },

          // Organization & billing
          organizationId: 'azure-security-org-456',
          subscriptionId: 'plan-azure-security-2024',

          // Product & task tracking
          productId: 'azure-ai-security-advisor',
          taskType: 'enterprise-security-streaming',
          agent: 'azure-security-architect',

          // Session tracking
          traceId: 'azure-security-trace-789',

          // Quality metrics
          responseQualityScore: 0.94,  // 0.0-1.0 scale
        },
      } as ResponsesCreateParams);

      console.log('Streaming Azure security guidance:');
      for await (const event of stream) {
        if (event.type === 'response.output_text.delta') {
          process.stdout.write(event.delta);
        }
      }
      console.log('\n Azure security stream completed');
    } else {
      throw new Error('Responses API not available');
    }
  } catch (error) {
    console.log('️ Azure Responses API not yet available in this OpenAI SDK version');
    console.log('   Error:', (error as Error).message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Example 3: Basic Azure Responses API streaming with array input (no metadata)
  console.log(' Example 3: Basic Azure Responses API streaming with array input (no metadata)');
  try {
    const responsesAPI = azure as any;

    if (responsesAPI.responses?.create) {
      const stream = await responsesAPI.responses.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o',
        input: [
          {
            role: 'user',
            content:
              'Write a technical overview of Azure AI services and their integration capabilities.',
          },
        ],
        stream: true,
      } as ResponsesCreateParams);

      console.log('Streaming Azure AI overview:');
      for await (const event of stream) {
        if (event.type === 'response.output_text.delta') {
          process.stdout.write(event.delta);
        }
      }
      console.log('\n Azure AI overview stream completed');
    } else {
      throw new Error('Responses API not available');
    }
  } catch (error) {
    console.log('️ Azure Responses API not yet available in this OpenAI SDK version');
    console.log('   Error:', (error as Error).message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Example 4: Advanced Azure Responses API streaming with comprehensive enterprise metadata
  console.log(
    ' Example 4: Advanced Azure Responses API streaming with comprehensive enterprise metadata'
  );
  try {
    const responsesAPI = azure as any;

    if (responsesAPI.responses?.create) {
      const stream = await responsesAPI.responses.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o',
        input: [
          {
            role: 'user',
            content:
              'Provide a detailed implementation guide for building scalable AI applications on Azure with proper monitoring and governance.',
          },
        ],
        stream: true,
        temperature: 0.4,
        max_output_tokens: 350,
        instructions:
          'You are an Azure solutions architect specializing in scalable AI implementations with enterprise governance.',
        usageMetadata: {
          // User identification
          subscriber: {
            id: 'azure-enterprise-architect-789',
            email: 'architect@azureenterprise.com',
            credential: {
              name: 'api-key-prod',
              value: 'key-bcd-890',
            },
          },

          // Organization & billing
          organizationId: 'azure-enterprise-streaming-012',
          subscriptionId: 'plan-azure-scalable-2024',

          // Product & task tracking
          productId: 'azure-scalable-ai-architect',
          taskType: 'enterprise-scalable-ai-streaming',
          agent: 'azure-enterprise-solutions-architect',

          // Session tracking
          traceId: 'azure-scalable-trace-345',

          // Quality metrics
          responseQualityScore: 0.98,  // 0.0-1.0 scale
        },
      } as ResponsesCreateParams);

      console.log('Advanced Azure enterprise streaming:');
      let deltaCount = 0;
      for await (const event of stream) {
        if (event.type === 'response.output_text.delta') {
          process.stdout.write(event.delta);
          deltaCount++;
        }
      }
      console.log(`\n Advanced Azure enterprise stream completed (${deltaCount} delta events)`);
    } else {
      throw new Error('Responses API not available');
    }
  } catch (error) {
    console.log('️ Azure Responses API not yet available in this OpenAI SDK version');
    console.log('   Error:', (error as Error).message);
  }

  console.log('\n All Azure Responses API streaming examples completed!');
}

main().catch(console.error);
