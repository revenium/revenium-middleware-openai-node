/**
 * Metadata Example
 * Demonstrates basic usage of Revenium OpenAI middleware.
 */

import { Initialize, GetClient, UsageMetadata } from "@revenium/openai";

async function main() {
  // Initialize middleware
  Initialize();

  // Get client
  const client = GetClient();

  // Optional metadata for advanced reporting, lineage tracking, and cost allocation
  const metadata: UsageMetadata = {
    // Organization & billing
    organizationId: "org-metadata-demo",
    subscriptionId: "plan-premium-2025",

    // Product & task tracking
    productId: "ai-assistant",
    taskType: "explanation-request",
    agent: "openai-metadata-chat-node",

    // Session tracking
    traceId: "session-" + Date.now(),

    // Quality metrics
    responseQualityScore: 0.95, // 0.0-1.0 scale

    // User tracking
    subscriber: {
      id: "user-12345",
      email: "developer@company.com",
      credential: {
        name: "api-key-prod",
        value: "key-abc-123",
      },
    },
  };
  const response = await client
    .chat()
    .completions()
    .create(
      {
        model: "gpt-4",
        messages: [
          {
            role: "user" as const,
            content:
              "Say hello in Spanish and explain why Spanish is a beautiful language in 2-3 sentences.",
          },
        ],
        max_tokens: 1000,
      },
      metadata
    );

  // Display response
  if (response.choices.length > 0) {
    console.log(`Assistant: ${response.choices[0].message.content}`);
  }
  console.log("\nUsage data sent to Revenium! Check your dashboard");
}

main().catch(console.error);
