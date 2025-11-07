/**
 * OpenAI Responses API Basic Examples
 *
 * This file demonstrates how to use the new OpenAI Responses API with the Revenium middleware.
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
 * Responses API Reference: https://platform.openai.com/docs/api-reference/responses
 */

import 'dotenv/config';
import { initializeReveniumFromEnv, patchOpenAIInstance } from '@revenium/openai';
import OpenAI from 'openai';

// Import types for the new Responses API
import type { ResponsesCreateParams, ResponsesResponse } from '../src/types/responses-api.js';

async function main() {
  // Initialize Revenium middleware
  await initializeReveniumFromEnv();

  // Create OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Patch the OpenAI instance to add Revenium tracking
  patchOpenAIInstance(openai);

  console.log(' OpenAI Responses API Basic Examples\n');

  // Example 1: Basic Responses API call (no metadata)
  console.log(' Example 1: Basic Responses API call (no metadata)');
  try {
    const responsesAPI = openai as any; // Type assertion for new API

    if (responsesAPI.responses?.create) {
      const response: ResponsesResponse = await responsesAPI.responses.create({
        model: 'gpt-5',
        input: 'What is the capital of France?',
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
    console.log('️ Responses API not yet available in this OpenAI SDK version');
    console.log('   Error:', (error as Error).message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Example 2: Responses API with rich metadata
  console.log(' Example 2: Responses API with rich metadata');
  try {
    const responsesAPI = openai as any;

    if (responsesAPI.responses?.create) {
      const response: ResponsesResponse = await responsesAPI.responses.create({
        model: 'gpt-5',
        input: [
          {
            role: 'user',
            content: 'Explain quantum computing in simple terms.',
          },
        ],
        max_output_tokens: 150,
        usageMetadata: {
          // User identification
          subscriber: {
            id: 'user-123',
            email: 'user@example.com',
            credential: {
              name: 'api-key-prod',
              value: 'key-efg-123',
            },
          },

          // Organization & billing
          organizationId: 'org-456',
          subscriptionId: 'plan-responses-2024',

          // Product & task tracking
          productId: 'quantum-explainer',
          taskType: 'educational-content',
          agent: 'quantum-tutor',

          // Session tracking
          traceId: 'trace-789',

          // Quality metrics
          responseQualityScore: 0.95,  // 0.0-1.0 scale
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
    console.log('️ Responses API not yet available in this OpenAI SDK version');
    console.log('   Error:', (error as Error).message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Example 3: Basic Responses API with string input (no metadata)
  console.log(' Example 3: Basic Responses API with string input (no metadata)');
  try {
    const responsesAPI = openai as any;

    if (responsesAPI.responses?.create) {
      const response: ResponsesResponse = await responsesAPI.responses.create({
        model: 'gpt-5',
        input: 'Write a haiku about programming.',
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
    console.log('️ Responses API not yet available in this OpenAI SDK version');
    console.log('   Error:', (error as Error).message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Example 4: Advanced Responses API with comprehensive metadata
  console.log(' Example 4: Advanced Responses API with comprehensive metadata');
  try {
    const responsesAPI = openai as any;

    if (responsesAPI.responses?.create) {
      const response: ResponsesResponse = await responsesAPI.responses.create({
        model: 'gpt-5',
        input: [
          {
            role: 'user',
            content: 'Provide a comprehensive overview of the Responses API capabilities.',
          },
        ],
        max_output_tokens: 200,
        instructions: 'You are a helpful AI assistant specializing in API documentation.',
        usageMetadata: {
          // User identification
          subscriber: {
            id: 'enterprise-user-456',
            email: 'enterprise@company.com',
            credential: {
              name: 'api-key-prod',
              value: 'key-hij-456',
            },
          },

          // Organization & billing
          organizationId: 'enterprise-org-789',
          subscriptionId: 'plan-enterprise-docs-2024',

          // Product & task tracking
          productId: 'api-documentation-assistant',
          taskType: 'technical-documentation',
          agent: 'documentation-expert',

          // Session tracking
          traceId: 'enterprise-trace-012',

          // Quality metrics
          responseQualityScore: 0.98,  // 0.0-1.0 scale
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
    console.log('️ Responses API not yet available in this OpenAI SDK version');
    console.log('   Error:', (error as Error).message);
  }

  console.log('\n All Responses API examples completed!');
}

main().catch(console.error);
