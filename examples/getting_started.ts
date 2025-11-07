import 'dotenv/config';
import { initializeReveniumFromEnv, patchOpenAIInstance } from '@revenium/openai';
import OpenAI from 'openai';

async function main() {
  const initResult = initializeReveniumFromEnv();
  if (!initResult.success) {
    console.error('Failed to initialize Revenium:', initResult.message);
    process.exit(1);
  }

  const openai = patchOpenAIInstance(new OpenAI());

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Please verify you are ready to assist me.' }
    ],

    /* Optional metadata for advanced reporting, lineage tracking, and cost allocation
    usageMetadata: {
      // User identification
      subscriber: {
        id: 'user-123',
        email: 'user@example.com',
        credential: {
          name: 'api-key-prod',
          value: 'key-abc-123'
        }
      },

      // Organization & billing
      organizationId: 'my-customers-name',
      subscriptionId: 'plan-enterprise-2024',

      // Product & task tracking
      productId: 'my-product',
      taskType: 'doc-summary',
      agent: 'customer-support',

      // Session tracking
      traceId: 'session-' + Date.now(),

      // Quality metrics
      responseQualityScore: 0.95  // 0.0-1.0 scale
    }
    */
  });

  console.log('Response:', response.choices[0]?.message?.content);
}

main().catch(console.error);
