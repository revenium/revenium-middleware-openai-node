/**
 * Azure OpenAI Responses API Basic Examples
 *
 * This file demonstrates how to use the new Azure OpenAI Responses API with the Revenium middleware.
 * The Responses API is a new stateful API that brings together capabilities from chat completions
 * and assistants API in one unified experience.
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
import type { ResponsesCreateParams, ResponsesResponse } from '../src/types/responses-api.js';

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

  console.log(' Azure OpenAI Responses API Basic Examples\n');

  // Example 1: Basic Azure Responses API call (no metadata)
  console.log(' Example 1: Basic Azure Responses API call (no metadata)');
  try {
    const responsesAPI = azure as any; // Type assertion for new API

    if (responsesAPI.responses?.create) {
      const response: ResponsesResponse = await responsesAPI.responses.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o',
        input: 'What are the benefits of using Azure OpenAI Service?',
      } as ResponsesCreateParams);

      console.log('Response ID:', response.id);
      console.log('Model:', response.model);
      console.log('Status:', response.status);
      console.log('Output Text:', response.output_text);
      console.log('Usage:', response.usage);
    } else {
      throw new Error('Responses API not available');
    }
  } catch (error) {
    console.log('️ Azure Responses API not yet available in this OpenAI SDK version');
    console.log('   Error:', (error as Error).message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Example 2: Azure Responses API with rich enterprise metadata
  console.log(' Example 2: Azure Responses API with rich enterprise metadata');
  try {
    const responsesAPI = azure as any;

    if (responsesAPI.responses?.create) {
      const response: ResponsesResponse = await responsesAPI.responses.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o',
        input: [
          {
            role: 'user',
            content: 'Explain Azure AI services integration patterns for enterprise applications.',
          },
        ],
        temperature: 0.6,
        max_output_tokens: 200,
        usageMetadata: {
          // User identification
          subscriber: {
            id: 'azure-enterprise-user-123',
            email: 'enterprise@azurecorp.com',
            credential: {
              name: 'api-key-prod',
              value: 'key-stu-901',
            },
          },

          // Organization & billing
          organizationId: 'azure-enterprise-org-456',
          subscriptionId: 'plan-azure-responses-2024',

          // Product & task tracking
          productId: 'azure-ai-integration-assistant',
          taskType: 'enterprise-architecture-guidance',
          agent: 'azure-ai-architect',

          // Session tracking
          traceId: 'azure-trace-789',

          // Quality metrics
          responseQualityScore: 0.96,  // 0.0-1.0 scale
        },
      } as ResponsesCreateParams);

      console.log('Response ID:', response.id);
      console.log('Model:', response.model);
      console.log('Status:', response.status);
      console.log('Output Text:', response.output_text?.substring(0, 100) + '...');
      console.log('Usage:', response.usage);
    } else {
      throw new Error('Responses API not available');
    }
  } catch (error) {
    console.log('️ Azure Responses API not yet available in this OpenAI SDK version');
    console.log('   Error:', (error as Error).message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Example 3: Basic Azure Responses API with string input (no metadata)
  console.log(' Example 3: Basic Azure Responses API with string input (no metadata)');
  try {
    const responsesAPI = azure as any;

    if (responsesAPI.responses?.create) {
      const response: ResponsesResponse = await responsesAPI.responses.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o',
        input: 'Write a brief summary of Azure OpenAI capabilities.',
      } as ResponsesCreateParams);

      console.log('Response ID:', response.id);
      console.log('Model:', response.model);
      console.log('Status:', response.status);
      console.log('Output Text:', response.output_text);
      console.log('Usage:', response.usage);
    } else {
      throw new Error('Responses API not available');
    }
  } catch (error) {
    console.log('️ Azure Responses API not yet available in this OpenAI SDK version');
    console.log('   Error:', (error as Error).message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Example 4: Advanced Azure Responses API with comprehensive enterprise metadata
  console.log(' Example 4: Advanced Azure Responses API with comprehensive enterprise metadata');
  try {
    const responsesAPI = azure as any;

    if (responsesAPI.responses?.create) {
      const response: ResponsesResponse = await responsesAPI.responses.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o',
        input: [
          {
            role: 'user',
            content:
              'Provide a comprehensive guide for implementing Azure OpenAI in a multi-tenant SaaS application.',
          },
        ],
        temperature: 0.3,
        max_output_tokens: 250,
        instructions:
          'You are an Azure AI solutions architect providing detailed technical guidance.',
        usageMetadata: {
          // User identification
          subscriber: {
            id: 'azure-saas-architect-789',
            email: 'architect@azuresaas.com',
            credential: {
              name: 'api-key-prod',
              value: 'key-vwx-234',
            },
          },

          // Organization & billing
          organizationId: 'azure-saas-enterprise-012',
          subscriptionId: 'plan-azure-saas-2024',

          // Product & task tracking
          productId: 'azure-saas-ai-architect',
          taskType: 'multi-tenant-architecture-design',
          agent: 'azure-saas-solutions-architect',

          // Session tracking
          traceId: 'azure-saas-trace-345',

          // Quality metrics
          responseQualityScore: 0.99,  // 0.0-1.0 scale
        },
      } as ResponsesCreateParams);

      console.log('Response ID:', response.id);
      console.log('Model:', response.model);
      console.log('Status:', response.status);
      console.log('Output Text:', response.output_text?.substring(0, 150) + '...');
      console.log('Usage:', response.usage);
      console.log('Output Array Length:', response.output?.length);
    } else {
      throw new Error('Responses API not available');
    }
  } catch (error) {
    console.log('️ Azure Responses API not yet available in this OpenAI SDK version');
    console.log('   Error:', (error as Error).message);
  }

  console.log('\n All Azure Responses API examples completed!');
}

main().catch(console.error);
