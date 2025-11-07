/**
 * OpenAI Responses API Streaming Examples
 *
 * This file demonstrates how to use the new OpenAI Responses API with streaming enabled
 * using the Revenium middleware. The Responses API supports streaming for real-time
 * response generation.
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
import type { ResponsesCreateParams } from '../src/types/responses-api.js';

async function main() {
  // Initialize Revenium middleware
  await initializeReveniumFromEnv();

  // Create OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Patch the OpenAI instance to add Revenium tracking
  patchOpenAIInstance(openai);

  console.log(' OpenAI Responses API Streaming Examples\n');

  // Example 1: Basic Responses API streaming (no metadata)
  console.log(' Example 1: Basic Responses API streaming (no metadata)');
  try {
    const responsesAPI = openai as any; // Type assertion for new API

    if (responsesAPI.responses?.create) {
      const stream = await responsesAPI.responses.create({
        model: 'gpt-5',
        input: 'Tell me a short story about a robot learning to paint.',
        stream: true,
      } as ResponsesCreateParams);

      console.log('Streaming response:');
      for await (const event of stream) {
        if (event.type === 'response.output_text.delta') {
          process.stdout.write(event.delta);
        }
      }
      console.log('\n Stream completed');
    } else {
      throw new Error('Responses API not available');
    }
  } catch (error) {
    console.log('️ Responses API not yet available in this OpenAI SDK version');
    console.log('   Error:', (error as Error).message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Example 2: Responses API streaming with rich metadata
  console.log(' Example 2: Responses API streaming with rich metadata');
  try {
    const responsesAPI = openai as any;

    if (responsesAPI.responses?.create) {
      const stream = await responsesAPI.responses.create({
        model: 'gpt-5',
        input: [
          {
            role: 'user',
            content: 'Explain the concept of machine learning in a conversational way.',
          },
        ],
        stream: true,
        max_output_tokens: 200,
        usageMetadata: {
          // User identification
          subscriber: {
            id: 'streaming-user-123',
            email: 'streaming@example.com',
            credential: {
              name: 'api-key-prod',
              value: 'key-klm-789',
            },
          },

          // Organization & billing
          organizationId: 'streaming-org-456',
          subscriptionId: 'plan-streaming-edu-2024',

          // Product & task tracking
          productId: 'ml-educator',
          taskType: 'educational-streaming',
          agent: 'ml-tutor-stream',

          // Session tracking
          traceId: 'stream-trace-789',

          // Quality metrics
          responseQualityScore: 0.92,  // 0.0-1.0 scale
        },
      } as ResponsesCreateParams);

      console.log('Streaming response with metadata:');
      for await (const event of stream) {
        if (event.type === 'response.output_text.delta') {
          process.stdout.write(event.delta);
        }
      }
      console.log('\n Stream with metadata completed');
    } else {
      throw new Error('Responses API not available');
    }
  } catch (error) {
    console.log('️ Responses API not yet available in this OpenAI SDK version');
    console.log('   Error:', (error as Error).message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Example 3: Basic Responses API streaming with array input (no metadata)
  console.log(' Example 3: Basic Responses API streaming with array input (no metadata)');
  try {
    const responsesAPI = openai as any;

    if (responsesAPI.responses?.create) {
      const stream = await responsesAPI.responses.create({
        model: 'gpt-5',
        input: [
          {
            role: 'user',
            content: 'Write a poem about the beauty of code.',
          },
        ],
        stream: true,
      } as ResponsesCreateParams);

      console.log('Streaming poetry:');
      for await (const event of stream) {
        if (event.type === 'response.output_text.delta') {
          process.stdout.write(event.delta);
        }
      }
      console.log('\n Poetry stream completed');
    } else {
      throw new Error('Responses API not available');
    }
  } catch (error) {
    console.log('️ Responses API not yet available in this OpenAI SDK version');
    console.log('   Error:', (error as Error).message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Example 4: Advanced Responses API streaming with comprehensive metadata
  console.log(' Example 4: Advanced Responses API streaming with comprehensive metadata');
  try {
    const responsesAPI = openai as any;

    if (responsesAPI.responses?.create) {
      const stream = await responsesAPI.responses.create({
        model: 'gpt-5',
        input: [
          {
            role: 'user',
            content:
              'Provide a detailed explanation of how streaming APIs work in real-time applications.',
          },
        ],
        stream: true,
        max_output_tokens: 300,
        instructions:
          'You are a technical expert explaining streaming APIs with practical examples.',
        usageMetadata: {
          // User identification
          subscriber: {
            id: 'advanced-streaming-user-789',
            email: 'advanced@enterprise.com',
            credential: {
              name: 'api-key-prod',
              value: 'key-nop-012',
            },
          },

          // Organization & billing
          organizationId: 'enterprise-streaming-org-012',
          subscriptionId: 'plan-enterprise-stream-2024',

          // Product & task tracking
          productId: 'streaming-api-educator',
          taskType: 'advanced-technical-streaming',
          agent: 'streaming-expert',

          // Session tracking
          traceId: 'advanced-stream-trace-345',

          // Quality metrics
          responseQualityScore: 0.97,  // 0.0-1.0 scale
        },
      } as ResponsesCreateParams);

      console.log('Advanced streaming response:');
      let deltaCount = 0;
      for await (const event of stream) {
        if (event.type === 'response.output_text.delta') {
          process.stdout.write(event.delta);
          deltaCount++;
        }
      }
      console.log(`\n Advanced stream completed (${deltaCount} delta events)`);
    } else {
      throw new Error('Responses API not available');
    }
  } catch (error) {
    console.log('️ Responses API not yet available in this OpenAI SDK version');
    console.log('   Error:', (error as Error).message);
  }

  console.log('\n All Responses API streaming examples completed!');
}

main().catch(console.error);
